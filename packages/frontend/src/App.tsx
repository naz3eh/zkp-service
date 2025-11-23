import X402Form from "@/components/X402Form";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-modern-animated py-16 px-4 relative overflow-hidden">
      {/* Enhanced mesh gradient background */}
      <div className="absolute inset-0 bg-gradient-mesh-enhanced pointer-events-none" />
      
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-gradient-grid pointer-events-none opacity-50" />
      
      {/* Floating gradient orbs with enhanced colors */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-[radial-gradient(circle,hsl(25_70%_58%_/_0.25),transparent_70%)] rounded-full blur-3xl opacity-50 animate-float pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[radial-gradient(circle,hsl(20_50%_45%_/_0.2),transparent_70%)] rounded-full blur-3xl opacity-40 animate-float pointer-events-none" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,hsl(25_70%_58%_/_0.15),transparent_70%)] rounded-full blur-3xl opacity-30 animate-float pointer-events-none" style={{ animationDelay: '4s' }} />
      
      {/* Additional smaller orbs for depth */}
      <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-[radial-gradient(circle,hsl(20_50%_45%_/_0.2),transparent_70%)] rounded-full blur-2xl opacity-30 animate-float pointer-events-none" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-[radial-gradient(circle,hsl(25_70%_58%_/_0.18),transparent_70%)] rounded-full blur-2xl opacity-25 animate-float pointer-events-none" style={{ animationDelay: '3s' }} />
      
      {/* Multiple radial gradient overlays for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(25_70%_58%_/_0.1),transparent_50%),radial-gradient(circle_at_70%_80%,hsl(20_50%_45%_/_0.08),transparent_50%),radial-gradient(circle_at_50%_50%,hsl(25_60%_55%_/_0.05),transparent_60%)] pointer-events-none" />
      
      {/* Subtle diagonal gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[hsl(25_70%_58%_/_0.02)] pointer-events-none" />
      
      <div className="relative z-10">
        <X402Form />
      </div>
    </div>
  );
};

export default Index;
