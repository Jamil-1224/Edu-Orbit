import React from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Users, Zap, Shield, BarChart3, DollarSign } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const HomePage = () => {
  const { user } = useAuthStore()

  const features = [
    {
      icon: Users,
      title: 'Complete User Management',
      description: 'Manage students, teachers, parents, and administrators efficiently'
    },
    {
      icon: BookOpen,
      title: 'Academic Management',
      description: 'Handle classes, subjects, attendance, and assignments seamlessly'
    },
    {
      icon: BarChart3,
      title: 'Performance Analytics',
      description: 'Track student progress with detailed reports and analytics'
    },
    {
      icon: DollarSign,
      title: 'Fee Management',
      description: 'Simplify fee collection and financial tracking'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with role-based access control'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Built with modern technologies for optimal performance'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="text-blue-600" size={32} />
            <h1 className="text-3xl font-bold text-blue-600">Edu Orbit</h1>
          </div>
          <nav className="flex items-center gap-4">
            {user ? (
              <Link
                to={`/${user.role}`}
                className="btn btn-primary"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          Complete Education Management System
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Streamline your school operations with Edu Orbit. Manage students, teachers, classes,
          attendance, marks, and more - all in one integrated platform.
        </p>
        {!user && (
          <div className="flex gap-4 justify-center">
            <Link to="/login" className="btn btn-primary btn-lg">
              Get Started
            </Link>
            <Link to="/register" className="btn btn-secondary btn-lg">
              Learn More
            </Link>
          </div>
        )}
      </section>

      {/* Features Grid */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="card text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Icon className="text-blue-600" size={32} />
                    </div>
                  </div>
                  <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16">
        <div className="max-w-4xl mx-auto text-center text-white px-4">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Transform Your School?
          </h3>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of schools already using Edu Orbit
          </p>
          {!user && (
            <Link to="/register" className="btn bg-white text-blue-600 hover:bg-gray-100 font-semibold">
              Start Free Trial
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2024 Edu Orbit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
