// One frame: the photo on its strip, place, author + friend button, likes,
// comments, report / block / delete.
import { html, useEffect, useState } from 'preact-htm';
import { useStore, getState, back, go, ago, toast, fail, plural } from '../lib/core.js';
import { loadPost, loadComments, addComment, deleteComment, toggleLike, deletePost, relation, block, report } from '../lib/data.js';
import { Icon, Avatar, Photo, FilmFrame, EdgePrint, stockFor, openSheet, closeSheet, Confirm, Loader, Spinner } from '../ui/kit.js';
import { FriendButton } from './friends.js';

export const REASONS = [
  ['spam', 'Spam or scam'],
  ['harassment', 'Harassment or bullying'],
  ['privacy', 'Shares someone’s location or private info'],
  ['nudity', 'Nudity or sexual content'],
  ['violence', 'Violence or threats'],
  ['fake', 'Fake profile or impersonation'],
  ['other', 'Something else'],
];

export function ReportSheet({ userId, postId, name }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  return html`<form class="stack" style="--gap:14px" onSubmit=${async (e) => {
    e.preventDefault();
    if (!reason) return;
    setBusy(true);
    try {
      await report({ userId, postId, reason, details });
      closeSheet();
      toast('Thanks. The club admins will look at it.');
    } catch (err) { setBusy(false); fail(err, 'Couldn’t send the report. Try again.'); }
  }}>
    <h2 class="h2">${postId ? 'Report this photo' : `Report ${name}`}</h2>
    <div class="radio-list" role="radiogroup">
      ${REASONS.map(([v, l]) => html`<label><input type="radio" name="reason" value=${v} checked=${reason === v} onChange=${() => setReason(v)} />${l}</label>`)}
    </div>
    <textarea class="textarea" maxlength="1000" placeholder="Anything else we should know? (optional)" value=${details} onInput=${(e) => setDetails(e.currentTarget.value)}></textarea>
    <p class="hint" style="margin:0">${name} won’t be told who reported them.</p>
    <button class="btn block" disabled=${!reason || busy}>${busy ? html`<${Spinner} />` : 'Send report'}</button>
  </form>`;
}

export function blockSheet(person, after) {
  openSheet(() => html`<${Confirm} title=${`Block ${person.name}?`}
    body="You won't see each other's profiles, photos, comments, free time or location. Any friendship ends. They aren't told."
    confirm="Block" onConfirm=${async () => {
      try {
        await block(person.id);
        toast(`${person.name} is blocked.`);
        after?.();
      } catch (e) { fail(e); throw e; }
    }} />`);
}

function PostMenu({ post }) {
  const mine = post.author_id === getState().me?.id;
  return html`<div class="menu">
    ${mine ? html`<button class="danger" onClick=${() => openSheet(() => html`<${Confirm} title="Delete this frame?" body="The photo and its likes and comments are deleted for everyone." confirm="Delete"
        onConfirm=${async () => { try { await deletePost(post); toast('Frame deleted.'); back('/'); } catch (e) { fail(e); throw e; } }} />`)}>
        <${Icon} name="trash" />Delete this frame</button>` : html`
      <button onClick=${() => openSheet(() => html`<${ReportSheet} postId=${post.id} userId=${post.author_id} name=${post.author?.name || 'this person'} />`)}><${Icon} name="flag" />Report this photo</button>
      <button class="danger" onClick=${() => blockSheet({ id: post.author_id, name: post.author?.name || 'this person' }, () => back('/'))}><${Icon} name="block" />Block ${post.author?.name}</button>`}
    <button onClick=${closeSheet}><${Icon} name="x" />Cancel</button>
  </div>`;
}

export function PostScreen({ id }) {
  const cached = useStore((s) => s.posts.find((p) => p.id === id));
  const liked = useStore((s) => s.likes.has(id));
  const me = useStore((s) => s.me);
  useStore((s) => s.friendships);
  const [post, setPost] = useState(cached || null);
  const [missing, setMissing] = useState(false);
  const [comments, setComments] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    let live = true;
    setMissing(false);
    loadPost(id).then((p) => { if (!live) return; if (p) setPost(p); else setMissing(true); }).catch(() => live && setMissing(true));
    loadComments(id).then((c) => live && setComments(c)).catch(() => live && setComments([]));
    return () => { live = false; };
  }, [id]);
  useEffect(() => { if (cached) setPost(cached); }, [cached]);

  if (missing && !post) {
    return html`<div class="screen full"><div class="topbar"><button class="icon-btn" onClick=${() => back('/')} aria-label="Back"><${Icon} name="back" /></button></div>
      <div class="page"><div class="empty"><${Icon} name="image" /><p>This frame isn’t available. It may have been deleted.</p><a class="btn sm quiet" href="#/">Back to the map</a></div></div></div>`;
  }
  if (!post) return html`<div class="screen full"><${Loader} /></div>`;

  const tall = post.height > post.width;
  const rel = relation(post.author_id);
  const frameNo = String(post.frame_no).padStart(2, '0');
  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const row = await addComment(post.id, text);
      setComments((c) => [...(c || []), row]);
      setText('');
    } catch (err) { fail(err, 'Couldn’t post that comment.'); }
    setSending(false);
  };

  return html`<article class="screen full" aria-label=${`Photo by ${post.author?.name}`}>
    <div class="post-top"><span class="edge">${stockFor(post)}</span><span class="edge">${frameNo}</span></div>
    <header class="topbar center" style="position:relative;padding-top:6px">
      <button class="icon-btn" onClick=${() => back('/')} aria-label="Back"><${Icon} name="back" /></button>
      <span class="title" aria-hidden="true">Spotted</span>
      <span class="spacer"></span>
      <button class="icon-btn" aria-label="More options" onClick=${() => openSheet(() => html`<${PostMenu} post=${post} />`)}><${Icon} name="more" /></button>
    </header>
    <${FilmFrame} stock=${stockFor(post)} frame=${frameNo}>
      <div class=${`post-photo ${tall ? 'tall' : ''}`} style=${post.width ? `--ar:${post.width}/${post.height}` : ''}>
        <${Photo} path=${post.photo_path} demo=${post.is_demo} eager alt=${post.caption || `Photo at ${post.place_name || 'Kalyani'}`} />
      </div>
    <//>
    <div class="page stack" style="--gap:18px;padding-top:16px">
      <div class="row" style="--gap:10px;flex-wrap:wrap">
        <a class="place-chip" href=${'#/?at=' + post.id}>
          <${Icon} name="pin" cls="sm" />${post.place_name || 'Kalyani'}${post.pin_precision === 'area' ? html`<span class="area">· area</span>` : null}
        </a>
        ${post.is_demo ? html`<span class="demo-tag">Demo frame</span>` : null}
      </div>
      <div class="author">
        <a href=${post.author_id === me?.id ? '#/me' : '#/u/' + post.author_id} class="row grow" style="--gap:12px;text-decoration:none;min-width:0">
          <${Avatar} person=${post.author} size=${46} />
          <span class="grow" style="min-width:0"><span class="name ellipsis" style="display:block">${post.author?.name}</span><span class="when">${ago(post.created_at)}</span></span>
        </a>
        ${rel !== 'self' ? html`<${FriendButton} id=${post.author_id} name=${post.author?.name} />` : null}
      </div>
      ${post.caption ? html`<p class="caption">${post.caption}</p>` : null}
      <div class="actions">
        <button class=${`act ${liked ? 'liked' : ''} ${pop ? 'pop' : ''}`} aria-pressed=${liked} aria-label=${liked ? 'Unlike' : 'Like'}
          onClick=${async () => { setPop(!liked); try { await toggleLike(post); } catch (e) { fail(e); } }}>
          <${Icon} name="heart" /><span>${post.like_count}</span>
        </button>
        <a class="act" href="#comment" onClick=${(e) => { e.preventDefault(); document.getElementById('comment')?.focus(); }} aria-label=${plural(post.comment_count, 'comment')}>
          <${Icon} name="comment" /><span>${post.comment_count}</span>
        </a>
        <span class="spacer grow"></span>
        <a class="act" href=${'#/?at=' + post.id} aria-label="Show on the map"><${Icon} name="map" /></a>
      </div>
      <hr class="divider" />
      <div class="comments" aria-live="polite">
        ${comments == null ? html`<${Loader} label="Loading comments" />` : comments.length === 0 ? html`<p class="faint ui" style="margin:0">No comments yet. Say something nice.</p>` :
          comments.map((c) => html`<div class="comment" key=${c.id}>
            <a href=${c.author_id === me?.id ? '#/me' : '#/u/' + c.author_id}><${Avatar} person=${c.author} size=${36} /></a>
            <div class="grow">
              <div class="who">${c.author?.name}<time>${ago(c.created_at)}</time></div>
              <p>${c.body}</p>
            </div>
            ${c.author_id === me?.id || post.author_id === me?.id ? html`<button class="icon-btn" style="width:36px;height:36px;color:var(--text-3)" aria-label="Delete comment"
              onClick=${async () => { try { await deleteComment(post.id, c.id); setComments((l) => l.filter((x) => x.id !== c.id)); } catch (e) { fail(e); } }}><${Icon} name="x" cls="sm" /></button>` : null}
          </div>`)}
      </div>
      <form class="comment-box" onSubmit=${send}>
        <label class="sr-only" for="comment">Add a comment</label>
        <input id="comment" placeholder="Add a comment…" maxlength="500" value=${text} onInput=${(e) => setText(e.currentTarget.value)} autocomplete="off" />
        <button class="icon-btn" aria-label="Send comment" disabled=${!text.trim() || sending}><${Icon} name="send" /></button>
      </form>
    </div>
    <div class="strip" style="margin-top:8px"><div class="sprockets"></div><${EdgePrint} left=${stockFor(post)} mid=${frameNo} /></div>
    <div style="height:calc(20px + var(--safe-b))"></div>
  </article>`;
}
