import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface WalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    formData: {
        x: string;
        y: string;
        publicKey: string;
        githubRepo: string;
    };
}

const WalletModal = ({ isOpen, onClose, onConfirm, formData }: WalletModalProps) => {
    const [isConnecting, setIsConnecting] = useState(false);

    const handleConfirm = async () => {
        setIsConnecting(true);
        // Simulate wallet connection delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        onConfirm();
        setIsConnecting(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Wallet className="w-5 h-5 text-primary" />
                        Confirm Transaction
                    </DialogTitle>
                    <DialogDescription>
                        Review your transaction details before confirming
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="p-4 bg-secondary/50 rounded-lg border border-border/50 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Coordinates</span>
                            <span className="font-mono text-sm">({formData.x}, {formData.y})</span>
                        </div>

                        <div className="flex justify-between items-start gap-2">
                            <span className="text-sm text-muted-foreground">Public Key</span>
                            <span className="font-mono text-xs text-right break-all max-w-[200px]">
                                {formData.publicKey}
                            </span>
                        </div>

                        <div className="flex justify-between items-start gap-2">
                            <span className="text-sm text-muted-foreground">Repository</span>
                            <span className="text-xs text-right break-all max-w-[200px]">
                                {formData.githubRepo}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">
                            This will trigger a payment transaction through the x402 protocol.
                            Please ensure you have sufficient funds in your wallet.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                            disabled={isConnecting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            className="flex-1 bg-primary hover:bg-primary/90"
                            disabled={isConnecting}
                        >
                            {isConnecting ? (
                                <>
                                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Confirm Payment
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default WalletModal;
