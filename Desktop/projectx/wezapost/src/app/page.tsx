import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 glass backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-xl font-bold font-mono text-gradient-primary">
                WezaPost
              </Link>
              <div className="hidden md:flex items-center space-x-8">
                <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </Link>
                <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
                <Link href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/auth/signin">
                <Button variant="ghost" size="sm" className="text-sm font-mono">
                  Sign In
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="sm" className="text-sm font-mono shadow-theme-sm">
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-16 sm:px-8 lg:pt-32 lg:pb-24">
        <div className="absolute inset-0 bg-gradient-secondary opacity-30"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 px-3 py-1 text-sm font-mono animate-fade-in">
            AI-Powered Social Media Management
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl mb-8 animate-slide-up">
            <span className="text-gradient-primary">Automate</span> your
            <br />
            social media presence
          </h1>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed font-mono animate-slide-up">
            Schedule posts, manage multiple accounts, and grow your audience across Twitter, LinkedIn, Instagram, YouTube, and more platforms with intelligent automation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-scale-in">
            <Link href="/dashboard">
              <Button size="lg" className="px-8 py-3 text-base font-mono shadow-theme-lg hover:shadow-theme-xl transition-all">
                Start Free Trial
              </Button>
            </Link>
            <Link href="#demo">
              <Button variant="outline" size="lg" className="px-8 py-3 text-base font-mono border-2 hover:shadow-theme-md transition-all">
                Watch Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 font-mono">
              Everything you need to scale
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-mono">
              Built for creators, marketers, and businesses who want to automate their social media workflow
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <Card className="group hover:shadow-theme-lg transition-all duration-300 border-border/50 animate-fade-in">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 font-mono">Smart Scheduling</h3>
                <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                  AI-powered optimal posting times and queue management across all your social platforms
                </p>
              </CardContent>
            </Card>

            {/* Feature Card 2 */}
            <Card className="group hover:shadow-theme-lg transition-all duration-300 border-border/50 animate-fade-in">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2m-2-4H9m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V9z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 font-mono">Multi-Platform</h3>
                <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                  Connect Twitter, LinkedIn, Instagram, YouTube, TikTok, and Facebook from one dashboard
                </p>
              </CardContent>
            </Card>

            {/* Feature Card 3 */}
            <Card className="group hover:shadow-theme-lg transition-all duration-300 border-border/50 animate-fade-in">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 font-mono">Analytics & Insights</h3>
                <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                  Track performance, engagement metrics, and optimize your content strategy with data
                </p>
              </CardContent>
            </Card>

            {/* Feature Card 4 */}
            <Card className="group hover:shadow-theme-lg transition-all duration-300 border-border/50 animate-fade-in">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 font-mono">Team Collaboration</h3>
                <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                  Work together with team members, approve content, and manage permissions seamlessly
                </p>
              </CardContent>
            </Card>

            {/* Feature Card 5 */}
            <Card className="group hover:shadow-theme-lg transition-all duration-300 border-border/50 animate-fade-in">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 font-mono">AI Content Assistant</h3>
                <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                  Generate engaging captions, hashtags, and content ideas powered by advanced AI models
                </p>
              </CardContent>
            </Card>

            {/* Feature Card 6 */}
            <Card className="group hover:shadow-theme-lg transition-all duration-300 border-border/50 animate-fade-in">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 font-mono">Enterprise Security</h3>
                <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                  Bank-grade encryption, OAuth security, and compliance with data protection regulations
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 sm:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 font-mono">
            Ready to automate your social media?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 font-mono">
            Join thousands of creators and businesses already using WezaPost to grow their online presence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="px-8 py-3 text-base font-mono shadow-theme-lg">
                Get Started Free
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline" size="lg" className="px-8 py-3 text-base font-mono">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Link href="/" className="text-xl font-bold font-mono text-gradient-primary mb-4 inline-block">
              WezaPost
            </Link>
            <p className="text-sm text-muted-foreground font-mono mb-6">
              AI-powered social media management for the modern creator
            </p>
            <div className="flex justify-center space-x-8 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors font-mono">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors font-mono">
                Terms
              </Link>
              <Link href="/support" className="hover:text-foreground transition-colors font-mono">
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}