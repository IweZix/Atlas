const dialog = document.querySelector<HTMLDialogElement>('#lightbox');
const img = dialog?.querySelector('img');
const count = dialog?.querySelector<HTMLElement>('[data-lb="count"]');

let photos: HTMLElement[] = [];
let index = 0;

function show(i: number) {
  if (!img || !count) return;
  index = (i + photos.length) % photos.length;
  const p = photos[index];
  img.src = p.dataset.full ?? '';
  img.alt = p.dataset.alt ?? '';
  count.textContent = `${index + 1} / ${photos.length}`;
}

document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const photo = target.closest<HTMLElement>('.photo');
  if (photo && dialog) {
    photos = [
      ...(photo.closest('.trip')?.querySelectorAll<HTMLElement>('.photo') ??
        []),
    ];
    show(photos.indexOf(photo));
    dialog.showModal();
    return;
  }
  if (target === dialog) dialog.close();
  const action = target.closest<HTMLElement>('[data-lb]')?.dataset.lb;
  if (action === 'close') dialog?.close();
  if (action === 'prev') show(index - 1);
  if (action === 'next') show(index + 1);
});

dialog?.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') show(index - 1);
  if (e.key === 'ArrowRight') show(index + 1);
});
