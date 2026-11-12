// Every read and write Spotted makes. RLS in supabase/schema.sql decides what
// each call is allowed to see; nothing here is trusted for safety.
import { sb, getState, setState, toast } from './core.js';
import { BUCKET, processAvatar, extFor } from './media.js';

const POST_COLS = 'id, author_id, photo_path, thumb_path, width, height, caption, place_name, lat, lng, pin_precision, frame_no, like_count, comment_count, is_demo, created_at, author:sp_profiles!sp_posts_author_id_fkey(id, name, avatar_path, is_demo, college)';

const uid = () => getState().session?.user?.id;
function check({ data, error }) { if (error) throw error; return data; }

// ---------------------------------------------------------------- profile
export async function loadMe() {
  const id = uid();
  const me = check(await sb.from('sp_profiles').select('*').eq('id', id).maybeSingle());
  setState({ me });
  return me;
}

async function uploadAvatar(file) {
  const blob = await processAvatar(file);
  const path = `${uid()}/avatar-${Date.now()}.${extFor(blob)}`;
  check(await sb.storage.from(BUCKET).upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false }));
  return path;
}

export async function saveProfile({ name, college, avatarFile }) {
  const id = uid();
  const prev = getState().me;
  const row = { id, user_id: id, name: name.trim(), college: college?.trim() || null };
  if (!prev) row.adult_confirmed_at = new Date().toISOString();
  if (avatarFile) row.avatar_path = await uploadAvatar(avatarFile);
  // Insert the first time, update after (an upsert would trip NOT NULL on
  // adult_confirmed_at, which is only sent once).
  const me = prev
    ? check(await sb.from('sp_profiles').update(row).eq('id', id).select('*').single())
    : check(await sb.from('sp_profiles').insert(row).select('*').single());
  if (avatarFile && prev?.avatar_path && prev.avatar_path !== me.avatar_path) {
    sb.storage.from(BUCKET).remove([prev.avatar_path]).catch(() => {});
  }
  setState({ me });
  return me;
}

export async function loadProfile(id) {
  return check(await sb.from('sp_profiles').select('id, name, college, avatar_path, is_demo, created_at').eq('id', id).maybeSingle());
}

export async function searchPeople(q) {
  const term = q.trim().replace(/[%_,()]/g, ' ');
  if (term.length < 2) return [];
  return check(await sb.from('sp_profiles').select('id, name, college, avatar_path, is_demo')
    .ilike('name', `%${term}%`).neq('id', uid()).order('name').limit(25));
}

// ---------------------------------------------------------------- friends
export async function loadFriendships() {
  const rows = check(await sb.rpc('sp_my_friendships'));
  setState({ friendships: rows || [] });
  return rows;
}
export function relation(otherId) {
  if (!otherId) return 'none';
  if (otherId === uid()) return 'self';
  const f = getState().friendships.find((r) => r.other_id === otherId);
  return f ? f.state : 'none'; // friends | incoming | outgoing | none
}
export async function requestFriend(id) {
  const res = check(await sb.rpc('sp_request_friend', { target: id }));
  await loadFriendships();
  await loadSocial();
  return res;
}
export async function respondFriend(requestId, accept) {
  check(await sb.rpc('sp_respond_friend', { request_id: requestId, accept }));
  await loadFriendships();
  if (accept) await loadSocial();
}
export async function unfriend(id) {
  check(await sb.rpc('sp_unfriend', { other: id }));
  await loadFriendships();
  await loadSocial();
}

// ---------------------------------------------------------------- blocks + reports
export async function block(id) {
  check(await sb.rpc('sp_block', { target: id }));
  setState((s) => ({ posts: s.posts.filter((p) => p.author_id !== id) }));
  await Promise.all([loadFriendships(), loadSocial()]);
}
export async function loadBlocks() {
  // Blocked profiles are hidden from normal reads, so this RPC returns only
  // the people *you* blocked.
  return check(await sb.rpc('sp_my_blocks')) || [];
}
export async function unblock(id) {
  check(await sb.from('sp_blocks').delete().eq('blocker', uid()).eq('blocked', id));
  await loadPosts();
}
export async function report({ userId = null, postId = null, reason, details }) {
  check(await sb.from('sp_reports').insert({ reporter: uid(), target_user: userId, target_post: postId, reason, details: details?.trim() || null }));
}

// ---------------------------------------------------------------- free slots + presence
export async function loadSocial() {
  const [slots, presence] = await Promise.all([
    sb.from('sp_free_slots').select('*'),
    sb.from('sp_presence').select('*'),
  ]);
  const s = {};
  (check(slots) || []).forEach((r) => { s[r.user_id] = r; });
  const p = {};
  (check(presence) || []).forEach((r) => { p[r.user_id] = r; });
  setState({ slots: s, presence: p });
}
export async function saveGrid(grid) {
  const row = check(await sb.from('sp_free_slots').upsert({ user_id: uid(), grid }).select('*').single());
  setState((s) => ({ slots: { ...s.slots, [row.user_id]: row } }));
}
export async function setFreeUntil(date) {
  const mine = getState().slots[uid()];
  const row = check(await sb.from('sp_free_slots')
    .upsert({ user_id: uid(), grid: mine?.grid || '0'.repeat(72), free_until: date ? date.toISOString() : null })
    .select('*').single());
  setState((s) => ({ slots: { ...s.slots, [row.user_id]: row } }));
}

// ---------------------------------------------------------------- posts
export async function loadPosts() {
  const rows = check(await sb.from('sp_posts').select(POST_COLS).order('created_at', { ascending: false }).limit(400));
  const mine = check(await sb.from('sp_likes').select('post_id').eq('user_id', uid()));
  setState({ posts: rows, likes: new Set(mine.map((r) => r.post_id)), postsLoaded: true });
}
export async function loadPost(id) {
  const fresh = check(await sb.from('sp_posts').select(POST_COLS).eq('id', id).maybeSingle());
  if (fresh) setState((s) => ({ posts: s.posts.some((p) => p.id === id) ? s.posts.map((p) => (p.id === id ? fresh : p)) : [fresh, ...s.posts] }));
  return fresh || null;
}
export async function profilePosts(id) {
  return check(await sb.from('sp_posts').select(POST_COLS).eq('author_id', id).order('created_at', { ascending: false }).limit(120));
}
export async function toggleLike(post) {
  const liked = getState().likes.has(post.id);
  const bump = (d) => setState((s) => {
    const likes = new Set(s.likes);
    d > 0 ? likes.add(post.id) : likes.delete(post.id);
    return { likes, posts: s.posts.map((p) => (p.id === post.id ? { ...p, like_count: Math.max(0, p.like_count + d) } : p)) };
  });
  bump(liked ? -1 : 1);
  const res = liked
    ? await sb.from('sp_likes').delete().eq('post_id', post.id).eq('user_id', uid())
    : await sb.from('sp_likes').insert({ post_id: post.id, user_id: uid() });
  if (res.error && res.error.code !== '23505') { bump(liked ? 1 : -1); throw res.error; }
}
export async function loadComments(postId) {
  return check(await sb.from('sp_comments').select('id, body, created_at, author_id, author:sp_profiles!sp_comments_author_id_fkey(id, name, avatar_path, is_demo)')
    .eq('post_id', postId).order('created_at', { ascending: true }).limit(200));
}
export async function addComment(postId, body) {
  const row = check(await sb.from('sp_comments').insert({ post_id: postId, author_id: uid(), body: body.trim() })
    .select('id, body, created_at, author_id, author:sp_profiles!sp_comments_author_id_fkey(id, name, avatar_path, is_demo)').single());
  setState((s) => ({ posts: s.posts.map((p) => (p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p)) }));
  return row;
}
export async function deleteComment(postId, id) {
  check(await sb.from('sp_comments').delete().eq('id', id));
  setState((s) => ({ posts: s.posts.map((p) => (p.id === postId ? { ...p, comment_count: Math.max(0, p.comment_count - 1) } : p)) }));
}

export async function createPost({ full, thumb, caption, placeName, lat, lng, precision }) {
  const me = uid();
  const id = crypto.randomUUID();
  const photo_path = `${me}/${id}.${extFor(full.blob)}`;
  const thumb_path = `${me}/${id}_t.${extFor(thumb.blob)}`;
  const store = sb.storage.from(BUCKET);
  check(await store.upload(photo_path, full.blob, { contentType: full.blob.type, cacheControl: '31536000', upsert: false }));
  try {
    check(await store.upload(thumb_path, thumb.blob, { contentType: thumb.blob.type, cacheControl: '31536000', upsert: false }));
    const row = check(await sb.from('sp_posts').insert({
      id, author_id: me, photo_path, thumb_path, width: full.width, height: full.height,
      caption: caption?.trim() || null, place_name: placeName?.trim() || null, lat, lng, pin_precision: precision,
    }).select(POST_COLS).single());
    setState((s) => ({ posts: [row, ...s.posts] }));
    return row;
  } catch (e) {
    store.remove([photo_path, thumb_path]).catch(() => {});
    throw e;
  }
}
export async function deletePost(post) {
  check(await sb.from('sp_posts').delete().eq('id', post.id));
  if (!post.is_demo) sb.storage.from(BUCKET).remove([post.photo_path, post.thumb_path]).catch(() => {});
  setState((s) => ({ posts: s.posts.filter((p) => p.id !== post.id) }));
}

// ---------------------------------------------------------------- account
export async function deleteEverything() {
  const me = uid();
  // Photos first (the storage API is the only way to delete files).
  const files = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await sb.storage.from(BUCKET).list(me, { limit: 100, offset });
    if (error) throw error;
    files.push(...data.map((f) => `${me}/${f.name}`));
    if (data.length < 100) break;
    offset += 100;
  }
  for (let i = 0; i < files.length; i += 100) {
    const { error } = await sb.storage.from(BUCKET).remove(files.slice(i, i + 100));
    if (error) throw error;
  }
  check(await sb.rpc('sp_delete_me'));
  await sb.auth.signOut();
  toast('Your Spotted data is deleted.');
}
