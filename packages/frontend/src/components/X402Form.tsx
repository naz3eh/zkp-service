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
            // Simulate API call - replace with actual x402-fetch implementation
            await new Promise(resolve => setTimeout(resolve, 2000));

            const mockResults = {
                transactionId: "0x" + Math.random().toString(16).slice(2, 18),
                status: "confirmed",
                timestamp: new Date().toISOString(),
                data: formData,
                response: {
                    message: "Payment processed successfully via x402 protocol",
                    coordinates: `(${formData.x}, ${formData.y})`,
                    repository: formData.githubRepo,
                }
            };

            setResults(mockResults);
            toast.success("Transaction confirmed!");
        } catch (error) {
            toast.error("Transaction failed. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-3">
                <h1 className="text-5xl md:text-6xl font-bold font-display tracking-tight text-foreground">
                    x402 Payment Protocol
                </h1>
                <p className="text-muted-foreground text-lg font-medium">
                    Seamless blockchain payments for GitHub repositories
                </p>
            </div>

            <Card className="p-8 bg-card border border-border shadow-lg hover:shadow-xl transition-shadow duration-300">
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
                                className="bg-secondary/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
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
                                className="bg-secondary/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
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
                            className="bg-secondary/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono text-sm"
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
                            className="bg-secondary/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 rounded-lg transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                        disabled={isProcessing}
                    >
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
                    </Button>
                </form>
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
