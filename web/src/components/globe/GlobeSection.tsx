/**
 * Vidéo de présentation en boucle sur la landing page, à la place du globe 3D interactif.
 * Autoplay silencieux + inline pour rester conforme aux politiques mobiles (iOS Safari
 * n'autorise l'autoplay que si `muted` et `playsInline` sont posés sur l'élément).
 */
export function GlobeSection() {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-[40px]">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/video1.mp4"
        autoPlay
        loop
        muted
        playsInline
      />
    </div>
  );
}
