import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Users, Shield, Zap, Globe, Lock } from "lucide-react";
import NexioLogo from "@/components/NexioLogo";
import { loginUrl } from "@/lib/api";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="container mx-auto px-4 py-10 md:py-16">

        {/* Hero */}
        <div className="text-center mb-10 md:mb-16">
          {/* Logo + nom */}
          <div className="flex items-center justify-center gap-3 md:gap-4 mb-4 md:mb-6">
            <NexioLogo size={52} />
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground" data-testid="title-landing">
              Nexio
            </h1>
          </div>

          <p className="text-base md:text-xl text-muted-foreground mb-2 max-w-2xl mx-auto px-2 font-medium">
            La messagerie instantanée nouvelle génération.
          </p>
          <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-xl mx-auto px-2" data-testid="text-description">
            Connectez-vous, discutez en temps réel et restez proche des personnes qui comptent.
          </p>

          <Button
            size="lg"
            onClick={() => window.location.href = loginUrl()}
            className="text-base md:text-lg px-8 md:px-10 py-3 h-auto rounded-full shadow-lg hover:shadow-primary/30 transition-shadow"
            data-testid="button-login"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Commencer gratuitement
          </Button>

          <p className="mt-3 text-xs text-muted-foreground">Aucune carte bancaire requise · Chiffré de bout en bout</p>
        </div>

        {/* Stats rapides */}
        <div className="flex justify-center gap-8 md:gap-16 mb-10 md:mb-14 text-center">
          {[
            { value: "100%", label: "Gratuit" },
            { value: "< 50ms", label: "Latence" },
            { value: "E2E", label: "Chiffré" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</p>
              <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
          <Card className="text-center border-primary/10 hover:border-primary/30 transition-colors" data-testid="card-feature-messaging">
            <CardHeader className="pb-2 md:pb-4">
              <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-base md:text-lg">Instantané</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Messages livrés en moins de 50 ms grâce à notre infrastructure WebSocket haute performance.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-primary/10 hover:border-primary/30 transition-colors" data-testid="card-feature-profiles">
            <CardHeader className="pb-2 md:pb-4">
              <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-base md:text-lg">Profils riches</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Photo personnalisée, profession, centres d'intérêt — trouvez des personnes qui vous ressemblent.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center sm:col-span-2 md:col-span-1 border-primary/10 hover:border-primary/30 transition-colors" data-testid="card-feature-security">
            <CardHeader className="pb-2 md:pb-4">
              <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-base md:text-lg">Sécurisé & Privé</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Vos données vous appartiennent. Les messages expirent automatiquement et ne sont jamais revendus.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer minimal */}
        <p className="text-center text-xs text-muted-foreground mt-12">
          © {new Date().getFullYear()} Nexio · Messaging reimagined
        </p>
      </div>
    </div>
  );
}
