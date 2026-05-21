import Link from "next/link";
import Header from "@/components/Header";

const features = [
  { title: "Material Upload", description: "Upload PDFs, docs, or paste text. We'll organize it for you.", icon: "\u{1F4C4}" },
  { title: "AI Companion", description: "Chat with an AI that knows your materials and guides your learning.", icon: "\u{1F916}" },
  { title: "Knowledge Gaps", description: "Identify what you know and what needs more work with smart analysis.", icon: "\u{1F4CA}" },
  { title: "Smart Quizzes", description: "Practice with AI-generated questions tailored to your materials.", icon: "\u{1F4DD}" },
  { title: "Flashcards", description: "Create and review flashcards with spaced repetition.", icon: "\u{1F0CF}" },
  { title: "Learning Plans", description: "Get personalized day-by-day study plans based on your goals.", icon: "\u{1F4C5}" },
];

export default function Home() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight sm:lg:text-6xl">
              Your Personal AI Learning Mentor
            </h2>
            <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
              Upload your study materials and get a personalized learning path,
              quizzes, and a companion to guide you through every step.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link
                href="/register"
                className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
              >
                Sign In
              </Link>
            </div>
          </div>

          <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="relative p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}