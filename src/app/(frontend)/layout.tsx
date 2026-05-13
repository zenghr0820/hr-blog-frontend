import dynamic from "next/dynamic";
import { Header, Footer, OneImageBanner, KeyboardShortcutsProvider } from "@/components/layout";
import { ScrollInitializer } from "@/providers/scroll-initializer";
import { ExternalLinkInterceptor } from "@/providers/external-link-interceptor";
import { ConsolePrinter } from "@/providers/console-printer";
import { ReadingModeExit } from "@/components/ReadingModeExit";

const MusicPlayer = dynamic(() => import("@/components/MusicPlayer").then(mod => mod.MusicPlayer));
const RightMenu = dynamic(() => import("@/components/RightMenu").then(mod => mod.RightMenu));
const GlobalSidebar = dynamic(() => import("@/components/GlobalSidebar").then(mod => mod.GlobalSidebar));

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* <link rel="stylesheet" href="https://cdn.jsdmirror.com/gh/zenghr0820/Sharding-fonts/Yozai-Medium/result.css" /> */}
      {/* <link rel="stylesheet" href="https://cdn.jsdmirror.com/npm/lxgw-wenkai-screen-webfont@1.7.0/style.css" media="all" /> */}
      {/* <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/lxgw-wenkai-screen-web/1.510.0/style.css" media="all" /> */}
      <div id="frontend-layout" className="frontend-layout">
        <ScrollInitializer />
        <ConsolePrinter />
        <ExternalLinkInterceptor />
        <KeyboardShortcutsProvider />
        <Header />
        <OneImageBanner />
        <main id="frontend-main" className="flex-1">
          {children}
        </main>
        <Footer />
        <MusicPlayer />
        <RightMenu />
        <GlobalSidebar />

        <ReadingModeExit />
      </div>
    </>
  );
}
