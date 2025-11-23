import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Wallet, Github, Hash } from "lucide-react";
import WalletModal from "./WalletModal";
import ResultsDisplay from "./ResultsDisplay";

interface FormData {
    x: string;
    y: string;
    publicKey: string;
    githubRepo: string;
}

const X402Form = () => {
    const [formData, setFormData] = useState<FormData>({
        x: "",
        y: "",
        publicKey: "",
        githubRepo: "",
    });

    const [isWalletOpen, setIsWalletOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState<any>(null);

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateForm = (): boolean => {
        if (!formData.x || !formData.y) {
            toast.error("Please enter both X and Y coordinates");
            return false;
        }
        if (!formData.publicKey) {
            toast.error("Please enter your public key");
            return false;
        }
        if (!formData.githubRepo) {
            toast.error("Please enter your GitHub repository URL");
            return false;
        }
        if (!formData.githubRepo.includes("github.com")) {
            toast.error("Please enter a valid GitHub repository URL");
            return false;
        }
        return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            setIsWalletOpen(true);
        }
    };

    const handleWalletConfirm = async () => {
        setIsWalletOpen(false);
        setIsProcessing(true);

        try {
            // Import x402-fetch client dynamically
            const { x402Request } = await import("@/utils/x402-client");

            // Make payment-enabled API call
            // When the backend returns 402 Payment Required, x402-fetch will:
            // 1. Parse payment requirements from response headers
            // 2. Prompt MetaMask to make the payment
            // 3. Retry the request with payment proof
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
            const results = await x402Request(`${apiUrl}/api/paid/zkp/generate`, {
                method: "POST",
                body: JSON.stringify({
                    data: formData,
                    x: formData.x,
                    y: formData.y,
                    publicKey: formData.publicKey,
                    githubRepo: formData.githubRepo,
                }),
            });

            // Display results from paid API
            setResults({
                transactionId: results.transactionId || "0x" + Math.random().toString(16).slice(2, 18),
                status: results.status || "confirmed",
                timestamp: results.timestamp || new Date().toISOString(),
                data: formData,
                response: results.response || {
                    message: "Payment processed successfully via x402 protocol",
                    coordinates: `(${formData.x}, ${formData.y})`,
                    repository: formData.githubRepo,
                },
                paymentHash: results.paymentHash, // Transaction hash from payment
            });

            toast.success("Payment confirmed! Transaction processed.");
        } catch (error: any) {
            console.error("Payment or transaction failed:", error);

            // Handle specific error cases
            if (error.message?.includes("User rejected")) {
                toast.error("Payment was rejected in MetaMask");
            } else if (error.message?.includes("insufficient funds")) {
                toast.error("Insufficient funds for payment");
            } else if (error.message?.includes("MetaMask")) {
                toast.error("Please install MetaMask to continue");
            } else {
                toast.error(`Transaction failed: ${error.message || "Unknown error"}`);
            }
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <div className="inline-block">
                    <h1 className="text-5xl md:text-6xl font-bold font-display tracking-tight bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent animate-gradient-shift">
                        ZKP as a Service
                    </h1>
                </div>
                <p className="text-muted-foreground text-lg font-medium">
                    Seamless blockchain payments for GitHub repositories
                </p>
            </div>

            <Card className="p-8 bg-gradient-card border border-border/50 shadow-2xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group">
                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="shimmer absolute inset-0" />
                </div>

                {/* Gradient border glow */}
                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-primary blur-xl -z-10" />

                <div className="relative z-10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="x" className="flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-primary" />
                                    X Coordinate
                                </Label>
                                <Input
                                    id="x"
                                    type="number"
                                    placeholder="Enter X value"
                                    value={formData.x}
                                    onChange={(e) => handleInputChange("x", e.target.value)}
                                    className="bg-secondary/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all hover:border-primary/50 backdrop-blur-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="y" className="flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-primary" />
                                    Y Coordinate
                                </Label>
                                <Input
                                    id="y"
                                    type="number"
                                    placeholder="Enter Y value"
                                    value={formData.y}
                                    onChange={(e) => handleInputChange("y", e.target.value)}
                                    className="bg-secondary/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all hover:border-primary/50 backdrop-blur-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="publicKey" className="flex items-center gap-2">
                                <Wallet className="w-4 h-4 text-primary" />
                                Public Key
                            </Label>
                            <Input
                                id="publicKey"
                                type="text"
                                placeholder="0x..."
                                value={formData.publicKey}
                                onChange={(e) => handleInputChange("publicKey", e.target.value)}
                                className="bg-secondary/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all hover:border-primary/50 backdrop-blur-sm font-mono text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="githubRepo" className="flex items-center gap-2">
                                <Github className="w-4 h-4 text-primary" />
                                GitHub Repository
                            </Label>
                            <Input
                                id="githubRepo"
                                type="url"
                                placeholder="https://github.com/username/repo"
                                value={formData.githubRepo}
                                onChange={(e) => handleInputChange("githubRepo", e.target.value)}
                                className="bg-secondary/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all hover:border-primary/50 backdrop-blur-sm"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-gradient-primary hover:bg-gradient-primary-hover text-primary-foreground font-semibold py-6 rounded-lg transition-all duration-300 hover:shadow-2xl hover:shadow-primary/50 hover:-translate-y-1 active:translate-y-0 relative overflow-hidden group/btn"
                            disabled={isProcessing}
                        >
                            <span className="relative z-10 flex items-center justify-center">
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Processing Transaction...
                                    </>
                                ) : (
                                    <>
                                        <Wallet className="mr-2 h-5 w-5" />
                                        Connect Wallet & Pay
                                    </>
                                )}
                            </span>
                            {/* Shimmer effect on button */}
                            <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500">
                                <div className="shimmer absolute inset-0" />
                            </div>
                        </Button>
                    </form>
                </div>
            </Card>

            {results && <ResultsDisplay results={results} />}

            <WalletModal
                isOpen={isWalletOpen}
                onClose={() => setIsWalletOpen(false)}
                onConfirm={handleWalletConfirm}
                formData={formData}
            />
        </div>
    );
};

export default X402Form;
