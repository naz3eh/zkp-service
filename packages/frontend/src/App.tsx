import X402Form from "@/components/X402Form";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle py-16 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(210,105,30,0.04),transparent_40%)] pointer-events-none" />
      <div className="relative z-10">
        <X402Form />
      </div>
    </div>
  );
};

export default Index;
