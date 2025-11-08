import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, BookOpen, MessageSquare, Brain, Users, Award } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-primary/10 text-primary">
            <GraduationCap className="h-5 w-5" />
            <span className="text-sm font-medium">VNIT Learning Management System</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            LEARNING REIMAGINED
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A modern platform for professors and students to collaborate, learn, and grow together.
            Access materials, track progress, and connect in real-time.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="text-lg px-8 shadow-glow">
                Get Started
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Everything You Need to Succeed
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-border bg-card hover:shadow-elegant transition-all duration-300">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Study Materials</h3>
              <p className="text-muted-foreground">
                Access all your course materials organized by modules. PDFs, videos, presentations, and more.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:shadow-elegant transition-all duration-300">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Forum</h3>
              <p className="text-muted-foreground">
                Ask questions and get instant responses. Connect with peers and professors in course-specific forums.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:shadow-elegant transition-all duration-300">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Chatbot</h3>
              <p className="text-muted-foreground">
                Get instant answers to your academic questions with our intelligent AI assistant.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:shadow-elegant transition-all duration-300">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Collaborative Learning</h3>
              <p className="text-muted-foreground">
                Work together on assignments and projects. Share knowledge and learn from each other.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:shadow-elegant transition-all duration-300">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
              <p className="text-muted-foreground">
                Monitor your learning journey. Complete modules and track your achievements.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:shadow-elegant transition-all duration-300">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <GraduationCap className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Assignments & Quizzes</h3>
              <p className="text-muted-foreground">
                Submit assignments online and take quizzes. Get instant feedback and grades.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="border-border bg-gradient-primary text-primary-foreground">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Learning Experience?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Join VNIT-LMS today and be part of the future of education.
            </p>
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Sign Up Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
