import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Wallet, Github, Hash, RefreshCw } from "lucide-react";
import WalletModal from "./WalletModal";
import ResultsDisplay from "./ResultsDisplay";
import { fetchOasisPublicKey } from "@/utils/oasis-client";

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
    const [isFetchingPublicKey, setIsFetchingPublicKey] = useState(false);

    // Fetch Oasis public key on mount
    useEffect(() => {
        const loadPublicKey = async () => {
            setIsFetchingPublicKey(true);
            try {
                const publicKey = await fetchOasisPublicKey();
                setFormData(prev => ({ ...prev, publicKey }));
                toast.success("Loaded public key from Oasis service");
            } catch (error: any) {
                console.error("Failed to fetch Oasis public key:", error);
                toast.error("Could not fetch Oasis public key. You can enter it manually.");
            } finally {
                setIsFetchingPublicKey(false);
            }
        };

        loadPublicKey();
    }, []);

    const handleRefreshPublicKey = async () => {
        setIsFetchingPublicKey(true);
        try {
            const publicKey = await fetchOasisPublicKey();
            setFormData(prev => ({ ...prev, publicKey }));
            toast.success("Refreshed public key from Oasis service");
        } catch (error: any) {
            toast.error("Failed to refresh public key");
        } finally {
            setIsFetchingPublicKey(false);
        }
    };

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
            const merchantAddress = "0x0c12522fcda861460bf1bc223eca108144ee5df4";
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

            // 1. Send ETH payment directly via MetaMask
            console.log("💳 Sending payment...");
            const { sendDirectPayment } = await import("@/utils/direct-payment");
            const payment = await sendDirectPayment(merchantAddress, "0.001");
            console.log("✅ Payment sent:", payment.txHash);

            // 2. Call backend to "submit" data (gets dummy response)
            console.log("📝 Submitting to backend...");
            const backendResponse = await fetch(`${apiUrl}/api/zkp/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    data: formData,
                    x: formData.x,
                    y: formData.y,
                    publicKey: formData.publicKey,
                    githubRepo: formData.githubRepo,
                }),
            });

            const backendData = await backendResponse.json();
            console.log("✅ Backend response:", backendData);

            toast.success("Payment sent! Transaction confirmed on Sepolia.");

            // Display results with structure expected by ResultsDisplay
            setResults({
                transactionId: payment.txHash,
                status: "confirmed",
                timestamp: backendData.timestamp,
                data: backendData.data,
                response: {
                    message: "Payment confirmed on Sepolia! ZKP generated successfully.",
                    coordinates: backendData.data.coordinates,
                    repository: backendData.data.repository,
                },
                payment: payment,  // Keep payment data for potential future use
                proof: backendData.proof,
            });
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
                            <Label htmlFor="publicKey" className="flex items-center gap-2 justify-between">
                                <span className="flex items-center gap-2">
                                    <Wallet className="w-4 h-4 text-primary" />
                                    Public Key (from Oasis)
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRefreshPublicKey}
                                    disabled={isFetchingPublicKey}
                                    className="h-6 px-2 text-xs"
                                >
                                    <RefreshCw className={`w-3 h-3 mr-1 ${isFetchingPublicKey ? 'animate-spin' : ''}`} />
                                    {isFetchingPublicKey ? 'Loading...' : 'Refresh'}
                                </Button>
                            </Label>
                            <Input
                                id="publicKey"
                                type="text"
                                placeholder="0x..."
                                value={formData.publicKey}
                                onChange={(e) => handleInputChange("publicKey", e.target.value)}
                                className="bg-secondary/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all hover:border-primary/50 backdrop-blur-sm font-mono text-sm"
                                disabled={isFetchingPublicKey}
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
