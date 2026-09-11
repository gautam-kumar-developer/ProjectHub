import Link from "next/link";
import {
  Layers,
  ArrowRight,
  LayoutDashboard,
  KanbanSquare,
  BarChart3,
  Users,
  CheckCircle2,
  Zap,
  Shield,
  Clock,
  Star,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: KanbanSquare,
    title: "Kanban Boards",
    description:
      "Drag-and-drop task management with customizable columns. Visualize your workflow and move tasks effortlessly.",
    gradient: "from-blue-500 to-cyan-400",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description:
      "Beautiful charts and insights into your team's productivity. Track progress with interactive dashboards.",
    gradient: "from-violet-500 to-purple-400",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Assign tasks, manage roles, and keep everyone aligned. Built for teams of all sizes.",
    gradient: "from-pink-500 to-rose-400",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description:
      "Fine-grained permissions with Admin, Manager, and Member roles. Keep your data secure.",
    gradient: "from-amber-500 to-orange-400",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Built on Next.js 15 with Turbopack for blazing-fast performance. No lag, no waiting.",
    gradient: "from-emerald-500 to-teal-400",
  },
  {
    icon: Clock,
    title: "Due Date Tracking",
    description:
      "Never miss a deadline. Priority labels, due date alerts, and timeline views keep you on schedule.",
    gradient: "from-sky-500 to-indigo-400",
  },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Engineering Lead",
    company: "TechCorp",
    content:
      "ProjectHub transformed how our team works. The Kanban boards are incredibly intuitive and the analytics give us real visibility into our sprint velocity.",
    avatar: "SC",
  },
  {
    name: "Marcus Johnson",
    role: "Product Manager",
    company: "StartupXYZ",
    content:
      "We switched from three different tools to just ProjectHub. It handles everything — task tracking, team management, and reporting — all in one beautiful interface.",
    avatar: "MJ",
  },
  {
    name: "Emily Rodriguez",
    role: "Design Director",
    company: "CreativeStudio",
    content:
      "The UI is stunning. It's rare to find a project management tool that's both powerful and a pleasure to use. Our designers actually enjoy updating their tasks now.",
    avatar: "ER",
  },
];

const stats = [
  { value: "10K+", label: "Active Users" },
  { value: "250K+", label: "Tasks Completed" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9/5", label: "User Rating" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* ======================= NAVBAR ======================= */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 group" id="landing-logo">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-primary/25 transition-transform duration-300 group-hover:scale-110">
              <Layers className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Project<span className="gradient-text">Hub</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
              Features
            </a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
              Testimonials
            </a>
            <a href="#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
              Stats
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              id="landing-login-btn"
              className="hidden sm:inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              id="landing-register-btn"
              className="inline-flex items-center justify-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ======================= HERO ======================= */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32">
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/[0.07] blur-[120px] animate-pulse-glow" />
          <div className="absolute top-40 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-500/[0.05] blur-[100px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
          <div className="absolute bottom-0 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-pink-500/[0.04] blur-[100px] animate-pulse-glow" style={{ animationDelay: "3s" }} />
        </div>

        {/* Floating grid pattern */}
        <div className="absolute inset-0 -z-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

        <div className="mx-auto max-w-7xl px-6 text-center">
          {/* Badge */}
          <div className="animate-scale-in inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.08] px-4 py-1.5 text-xs font-medium text-primary mb-8">
            <Sparkles className="h-3.5 w-3.5" />
            Now with AI-Powered Insights
            <ChevronRight className="h-3 w-3" />
          </div>

          {/* Headline */}
          <h1 className="animate-slide-in-bottom text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1]">
            Manage Projects
            <br />
            <span className="gradient-text">with Clarity & Speed</span>
          </h1>

          {/* Sub-headline */}
          <p className="animate-slide-in-bottom mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed" style={{ animationDelay: "0.15s" }}>
            The all-in-one project management platform built for modern teams.
            Track tasks, visualize progress, and ship faster — together.
          </p>

          {/* CTA Buttons */}
          <div className="animate-slide-in-bottom mt-10 flex flex-col sm:flex-row items-center justify-center gap-4" style={{ animationDelay: "0.3s" }}>
            <Link
              href="/register"
              id="hero-cta-primary"
              className="inline-flex items-center justify-center gap-2 rounded-xl gradient-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Start for Free
              <ArrowRight className="h-4.5 w-4.5" />
            </Link>
            <Link
              href="/login"
              id="hero-cta-secondary"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/50 backdrop-blur-sm px-8 py-3.5 text-base font-medium text-foreground shadow-sm transition-all duration-300 hover:bg-accent hover:-translate-y-0.5"
            >
              <LayoutDashboard className="h-4.5 w-4.5" />
              View Demo
            </Link>
          </div>

          {/* Hero Visual — Abstract Dashboard Mockup */}
          <div className="animate-slide-in-bottom mt-16 md:mt-20 mx-auto max-w-5xl" style={{ animationDelay: "0.45s" }}>
            <div className="relative rounded-2xl border border-white/[0.08] bg-card/50 backdrop-blur-sm p-1 shadow-2xl shadow-primary/[0.08]">
              {/* Glare Effect */}
              <div className="absolute -top-px left-20 right-20 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

              <div className="rounded-xl bg-card/80 overflow-hidden">
                {/* Mock Titlebar */}
                <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/60" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                    <div className="h-3 w-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="mx-auto flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-1 text-xs text-muted-foreground">
                    <Shield className="h-3 w-3" />
                    projecthub.app/dashboard
                  </div>
                </div>

                {/* Mock Dashboard Content */}
                <div className="p-6 md:p-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: "Active Projects", value: "12", color: "bg-blue-500/10 text-blue-400" },
                      { label: "Tasks in Progress", value: "47", color: "bg-violet-500/10 text-violet-400" },
                      { label: "Team Members", value: "24", color: "bg-emerald-500/10 text-emerald-400" },
                      { label: "Completion Rate", value: "94%", color: "bg-amber-500/10 text-amber-400" },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-xl border border-border/50 bg-muted/30 p-4 text-left"
                      >
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${stat.color} w-fit px-0 rounded`}>
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Mock Kanban */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      {
                        title: "To Do",
                        color: "bg-muted-foreground/20",
                        tasks: ["Design system updates", "API documentation"],
                      },
                      {
                        title: "In Progress",
                        color: "bg-blue-500/30",
                        tasks: ["User authentication", "Dashboard redesign"],
                      },
                      {
                        title: "Done",
                        color: "bg-emerald-500/30",
                        tasks: ["Database setup", "CI/CD pipeline"],
                      },
                    ].map((column) => (
                      <div key={column.title} className="rounded-xl border border-border/50 bg-muted/20 p-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`h-2 w-2 rounded-full ${column.color}`} />
                          <span className="text-xs font-semibold text-foreground/80">{column.title}</span>
                        </div>
                        <div className="space-y-2">
                          {column.tasks.map((task) => (
                            <div
                              key={task}
                              className="rounded-lg border border-border/30 bg-card/60 px-3 py-2 text-xs text-muted-foreground"
                            >
                              {task}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================= STATS BAR ======================= */}
      <section id="stats" className="relative border-y border-border/50 bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-extrabold gradient-text">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================= FEATURES ======================= */}
      <section id="features" className="relative py-20 md:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-primary/[0.04] blur-[120px]" />
          <div className="absolute top-20 right-0 h-[300px] w-[300px] rounded-full bg-violet-500/[0.04] blur-[100px]" />
        </div>

        <div className="mx-auto max-w-7xl px-6">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.08] px-4 py-1.5 text-xs font-medium text-primary mb-4">
              <Zap className="h-3.5 w-3.5" />
              Powerful Features
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Everything You Need to
              <br />
              <span className="gradient-text">Ship Faster</span>
            </h2>
            <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto">
              From task tracking to team analytics, ProjectHub gives you a complete
              toolkit for managing projects at any scale.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 transition-all duration-300 hover:border-primary/30 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/[0.05] hover:-translate-y-1"
              >
                {/* Icon */}
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg`}>
                  <feature.icon className="h-5 w-5 text-white" />
                </div>

                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover arrow */}
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary opacity-0 translate-x-[-4px] transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                  Learn more <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================= TESTIMONIALS ======================= */}
      <section id="testimonials" className="relative py-20 md:py-32 border-t border-border/50 bg-muted/10">
        <div className="mx-auto max-w-7xl px-6">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.08] px-4 py-1.5 text-xs font-medium text-primary mb-4">
              <Star className="h-3.5 w-3.5" />
              Trusted by Teams
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Loved by Teams
              <br />
              <span className="gradient-text">Around the World</span>
            </h2>
            <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto">
              See why thousands of teams choose ProjectHub to manage their projects.
            </p>
          </div>

          {/* Testimonial Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/[0.04]"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  &ldquo;{testimonial.content}&rdquo;
                </p>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-xs font-bold text-white">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================= BOTTOM CTA ======================= */}
      <section className="relative py-20 md:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.06] blur-[150px]" />
        </div>

        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Ready to Transform
            <br />
            <span className="gradient-text">Your Workflow?</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground max-w-lg mx-auto">
            Join thousands of teams already using ProjectHub to ship better
            products, faster. Free to get started — no credit card required.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              id="bottom-cta-primary"
              className="inline-flex items-center justify-center gap-2 rounded-xl gradient-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Get Started for Free
              <ArrowRight className="h-4.5 w-4.5" />
            </Link>
            <Link
              href="/login"
              id="bottom-cta-secondary"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/50 backdrop-blur-sm px-8 py-3.5 text-base font-medium text-foreground shadow-sm transition-all duration-300 hover:bg-accent hover:-translate-y-0.5"
            >
              Sign In
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Free forever plan
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* ======================= FOOTER ======================= */}
      <footer className="border-t border-border/50 bg-muted/10">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                  <Layers className="h-4 w-4 text-white" />
                </div>
                <span className="text-base font-bold">ProjectHub</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Modern project management for teams that move fast.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#stats" className="hover:text-foreground transition-colors">Stats</a></li>
                <li><a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-border/50 pt-8">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} ProjectHub. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Built with Next.js, Tailwind CSS & Prisma
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
