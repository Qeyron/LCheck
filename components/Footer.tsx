import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-white/20 dark:border-gray-700/50 mt-16">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
          <div className="rounded-2xl p-2 bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 shadow-sm">
            <Image
              src="/dance.gif"
              alt="Dancing vibes"
              width={140}
              height={140}
              className="rounded-xl"
              loading="lazy"
            />
          </div>

          <a
            href="https://x.com/Qeyron"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-2xl border border-gray-300 dark:border-gray-700
                       px-4 py-3 font-semibold text-gray-900 dark:text-white
                       bg-white/70 dark:bg-gray-800/70 hover:bg-gray-50 dark:hover:bg-gray-800
                       transition-colors shadow-sm"
            aria-label="Профиль @Qeyron в X (Twitter)"
          >
            <span className="text-base">@Qeyron</span>
            <span className="opacity-70">Subscribe</span>

            <svg
              className="w-5 h-5 text-black dark:text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
