import { IntroPlayer } from "./intro-player";
import { Logo, Wordmark } from "./logo";

/* First visit only: the logo writes itself and its sun rises, then the
   tile forms around it as it flies up into its place in the header and the
   screen clears. The inline head script decides whether it
   plays, before first paint; the build is pure CSS so it starts at once. */
export function Intro({ name }: { name: string }) {
  return (
    <div className="intro" aria-hidden="true">
      <Logo className="intro-logo" />
      <Wordmark name={name} className="intro-wordmark" />
      <IntroPlayer />
    </div>
  );
}
