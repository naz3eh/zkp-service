import { Card } from "@/components/ui/card";
import { CheckCircle2, ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ResultsDisplayProps {
    results: {
        transactionId: string;
        status: string;
        timestamp: string;
        data: any;
        response: any;
    };
}

const ResultsDisplay = ({ results }: ResultsDisplayProps) => {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    return (
        <Card className="p-6 bg-gradient-card border border-border/50 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden group">
            {/* Gradient glow effect */}
            <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity duration-500 blur-2xl -z-10" />
            
            <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-primary rounded-full shadow-lg shadow-primary/30">
                        <CheckCircle2 className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                            Transaction Successful
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Your payment has been processed via x402 protocol
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="p-4 bg-secondary/50 rounded-lg border border-border/50 backdrop-blur-sm hover:border-primary/30 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Transaction ID</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(results.transactionId)}
                                className="h-8 px-2 hover:bg-primary/10 hover:text-primary transition-colors"
                            >
                                <Copy className="w-3 h-3" />
                            </Button>
                        </div>
                        <p className="font-mono text-sm break-all text-foreground">
                            {results.transactionId}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-secondary/50 rounded-lg border border-border/50 backdrop-blur-sm hover:border-primary/30 transition-all">
                            <span className="text-xs text-muted-foreground block mb-1">Status</span>
                            <span className="text-sm font-medium capitalize bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                                {results.status}
                            </span>
                        </div>

                        <div className="p-3 bg-secondary/50 rounded-lg border border-border/50 backdrop-blur-sm hover:border-primary/30 transition-all">
                            <span className="text-xs text-muted-foreground block mb-1">Timestamp</span>
                            <span className="text-sm font-medium">
                                {new Date(results.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                    </div>

                    <div className="p-4 bg-secondary/50 rounded-lg border border-border/50 backdrop-blur-sm space-y-2">
                        <h4 className="text-sm font-semibold mb-3">Response Data</h4>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Message:</span>
                                <span className="text-right">{results.response.message}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Coordinates:</span>
                                <span className="font-mono">{results.response.coordinates}</span>
                            </div>

                            <div className="flex justify-between items-center gap-2">
                                <span className="text-muted-foreground">Repository:</span>
                                <a
                                    href={results.response.repository}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-primary hover:underline text-xs"
                                >
                                    View on GitHub
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default ResultsDisplay;
