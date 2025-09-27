import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Home, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">404 - Halaman Tidak Dijumpai</h1>
          <p className="text-muted-foreground mb-6">
            Halaman yang anda cari tidak wujud atau telah dipindahkan.
          </p>
          <Button asChild data-testid="button-back-home">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Kembali ke Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
