import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header with theme toggle */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              WezaPost
            </h1>
            <p className="text-muted-foreground">
              AI-Powered Social Media Management
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="text-center">
          <div className="space-y-6 max-w-4xl mx-auto">
            
            {/* Phase 1 Complete Card */}
            <Card className="text-left">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Phase 1: Foundation & Infrastructure 
                  <Badge variant="success">Complete</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">✅ Core Setup</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Next.js 14+ with TypeScript</li>
                      <li>• Custom OKLCH color system</li>
                      <li>• Source Code Pro monospace typography</li>
                      <li>• Tailwind CSS with custom theme</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">✅ Features</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Dark/light mode toggle</li>
                      <li>• Component library foundation</li>
                      <li>• Theme transition animations</li>
                      <li>• Responsive design system</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps Card */}
            <Card className="text-left">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Next: Phase 2 - Core Features 
                  <Badge variant="outline">Pending</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">🔄 Authentication</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Supabase Auth setup</li>
                      <li>• User profile management</li>
                      <li>• Protected routes</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">🔄 Social Integration</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Twitter/LinkedIn OAuth</li>
                      <li>• Token management</li>
                      <li>• Basic posting engine</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button size="lg">
                Continue to Phase 2
              </Button>
              <Button variant="outline" size="lg">
                View Documentation
              </Button>
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}