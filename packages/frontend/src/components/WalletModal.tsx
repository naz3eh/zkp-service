import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";
import { useEffect } from "react";
import { useWallet } from "@/hooks/use-wallet";

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
    const { isConnected, isConnecting, address, chainId, error, connect, isMetaMaskInstalled } = useWallet();

    // Auto-connect when modal opens
    useEffect(() => {
        if (isOpen && !isConnected && !isConnecting && isMetaMaskInstalled) {
            connect();
        }
    }, [isOpen, isConnected, isConnecting, isMetaMaskInstalled, connect]);

    const handleConfirm = async () => {
        if (!isConnected) {
            await connect();
            return;
        }
        onConfirm();
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
                    {!isMetaMaskInstalled ? (
                        <div className="flex flex-col items-center gap-4 p-6 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <AlertCircle className="w-12 h-12 text-destructive" />
                            <div className="text-center space-y-2">
                                <h3 className="font-semibold">MetaMask Not Detected</h3>
                                <p className="text-sm text-muted-foreground">
                                    Please install MetaMask browser extension to continue
                                </p>
                                <Button
                                    variant="outline"
                                    className="mt-2"
                                    onClick={() => window.open('https://metamask.io/download/', '_blank')}
                                >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Install MetaMask
                                </Button>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-destructive">{error}</p>
                        </div>
                    ) : null}

                    {isConnected && address && (
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg space-y-2">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium">Wallet Connected</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Address:</span>
                                <span className="font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
                            </div>
                            {chainId && (
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground">Network:</span>
                                    <span>{chainId === 11155111 ? 'Sepolia' : `Chain ${chainId}`}</span>
                                </div>
                            )}
                        </div>
                    )}

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
                            {isConnected
                                ? " Click confirm to proceed with payment."
                                : " Please connect your wallet first."}
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
                            disabled={isConnecting || (!isConnected && !isMetaMaskInstalled)}
                        >
                            {isConnecting ? (
                                <>
                                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                                    Connecting...
                                </>
                            ) : !isConnected ? (
                                <>
                                    <Wallet className="mr-2 h-4 w-4" />
                                    Connect Wallet
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
