import type { Blog } from '../types';

function img(seed: string, w = 800, h = 520): Blog['image'] {
  return {
    src: `https://picsum.photos/seed/${seed}/${w}/${h}`,
    alt: seed.replace(/-/g, ' '),
    width: w,
    height: h,
    srcSet: `https://picsum.photos/seed/${seed}/${w}/${h} 1x, https://picsum.photos/seed/${seed}/${w * 2}/${h * 2} 2x`,
    sizes: '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
  };
}

export const blogs: Blog[] = [
  {
    id: 'blog-validating-ideas',
    slug: 'validating-ideas-without-code',
    title: 'Validating ideas without writing code',
    excerpt: 'Five experiments you can run this week to learn whether your idea solves a real problem.',
    author: 'Aarav Mehta',
    publishedAt: '2026-02-12T00:00:00.000Z',
    readingMinutes: 5,
    category: 'Product',
    featured: true,
    image: img('validating-ideas'),
    href: '/blogs/validating-ideas-without-code',
    content:
      'The fastest way to test a startup idea is to sell the outcome before you build the product. At EDC SIRT we ask teams to run a concierge experiment first: manually deliver the result to five real users and watch where they hesitate, smile, or drop off.\n\nPick one risky assumption this week — pricing, demand, or habit — and design the smallest test that could prove you wrong. A landing page with a waitlist, ten customer interviews, or a paper prototype shown in the canteen can teach you more than a month of coding.\n\nWrite down what you learned, share it with a mentor, and only then decide what to build. Validation is not about being right; it is about getting less wrong, faster.',
    linkedin_url: 'https://www.linkedin.com/posts/edc-sirt_example',
  },
  {
    id: 'blog-first-investor',
    slug: 'first-investor-meeting',
    title: 'What actually happens in a first investor meeting',
    excerpt: 'A founder unpacks the questions, the nerves, and what they would do differently next time.',
    author: 'Neha Sharma',
    publishedAt: '2026-01-28T00:00:00.000Z',
    readingMinutes: 6,
    category: 'Funding',
    featured: true,
    image: img('first-investor'),
    href: '/blogs/first-investor-meeting',
    content:
      'Your first investor meeting is rarely about the pitch deck. It is a thirty-minute conversation where the investor is testing how clearly you think about the problem, how well you know your user, and whether you can handle hard questions without bluffing.\n\nExpect questions like why now, why you, and what happens if a large player copies this. The founders who stand out bring numbers from real usage, speak honestly about what is broken, and ask the investor sharp questions about their own portfolio and support.\n\nTreat the meeting as the start of a relationship, not a verdict. Send a crisp follow-up with your metrics, your next milestone, and one specific ask. Even a no today can become a yes in six months if you keep showing progress.',
    linkedin_url: 'https://www.linkedin.com/posts/edc-sirt_example',
  },
  {
    id: 'blog-design-systems',
    slug: 'design-systems-for-students',
    title: 'Design systems for students who ship',
    excerpt: 'How to keep your product consistent when your team changes every semester.',
    author: 'Rohan Das',
    publishedAt: '2026-02-02T00:00:00.000Z',
    readingMinutes: 4,
    category: 'Design',
    featured: true,
    image: img('design-systems-students'),
    href: '/blogs/design-systems-for-students',
    content:
      'Student teams change every semester, but your product should not feel like it was rebuilt by strangers each time. A tiny design system — a shared palette, two type sizes, one button style, and a spacing rule — keeps every screen feeling like the same product.\n\nDocument your components in a single Figma file or a short markdown guide, and name things the way developers will use them. When a new member joins, they should be able to ship a consistent screen on day one without asking anyone for a color code.\n\nConsistency builds trust with users. Start small, enforce the system in code reviews, and let it grow only when a real need appears. A system nobody follows is worse than no system at all.',
    linkedin_url: 'https://www.linkedin.com/posts/edc-sirt_example',
  },
  {
    id: 'blog-campus-to-customer',
    slug: 'campus-to-first-customer',
    title: 'From campus project to first customer',
    excerpt: 'A third-year team shares how they found their first ten users on campus before writing a pitch deck.',
    author: 'EDC Editorial',
    publishedAt: '2026-01-18T00:00:00.000Z',
    readingMinutes: 7,
    category: 'Story',
    featured: false,
    image: img('campus-to-customer'),
    href: '/blogs/campus-to-first-customer',
    content:
      'The team behind a campus attendance tool found its first ten users without a single pitch slide. They stood outside the workshop hall, watched students struggle with manual registers, and offered to run attendance for one faculty member for one week.\n\nThat single pilot turned into honest feedback, late-night bug fixes, and a testimonial they still quote. Each new department came through a warm introduction from the last, and every feature was argued over with real usage data instead of opinions.\n\nTheir lesson is simple: your campus is a perfect early market. The users are nearby, the problems are visible, and the feedback is brutally honest. Win ten people who genuinely need you before chasing a hundred who might.',
    linkedin_url: 'https://www.linkedin.com/posts/edc-sirt_example',
  },
  {
    id: 'blog-brand-on-budget',
    slug: 'brand-on-a-student-budget',
    title: 'Building a brand on a student budget',
    excerpt: 'Type, color, and tone choices that make a small project feel considered and credible.',
    author: 'Isha Verma',
    publishedAt: '2026-01-10T00:00:00.000Z',
    readingMinutes: 4,
    category: 'Brand',
    featured: false,
    image: img('brand-on-budget'),
    href: '/blogs/brand-on-a-student-budget',
    content:
      'A credible brand does not need a big budget — it needs restraint. Pick one display font, one body font, and a two-color palette, then use them everywhere from your poster to your demo-day slides. Repetition is what makes a project look intentional.\n\nYour tone matters just as much. Write the way you speak at build nights: direct, warm, and specific. Replace vague claims with concrete details about who you help and what changes for them.\n\nFinally, spend your limited energy on the moments people photograph — the logo on the stall, the first screen of the app, the team photo. Small teams win attention by looking sharp exactly where it counts.',
    linkedin_url: 'https://www.linkedin.com/posts/edc-sirt_example',
  },
  {
    id: 'blog-mentor-questions',
    slug: 'questions-to-ask-a-mentor',
    title: 'Better questions to ask a mentor',
    excerpt: 'Replace “how do I start?” with questions that unlock specific, actionable advice.',
    author: 'Kabir Singh',
    publishedAt: '2026-02-15T00:00:00.000Z',
    readingMinutes: 3,
    category: 'Mentorship',
    featured: false,
    image: img('mentor-questions'),
    href: '/blogs/questions-to-ask-a-mentor',
    content:
      'Mentors give better answers when you bring better questions. Instead of asking how to start a startup, describe your last two weeks of work, share your numbers, and ask what they would do in your exact position with your constraints.\n\nGood questions are narrow and time-bound: how did you get your first ten paying users, what would you cut from this landing page, or who should I talk to before pricing this. They invite stories, not slogans.\n\nAlways close the loop. Try the advice, report back what happened, and thank them with specifics. Mentors invest more in founders who act on feedback and make the next conversation even sharper.',
    linkedin_url: 'https://www.linkedin.com/posts/edc-sirt_example',
  },
];

export const featuredBlogs = blogs.filter((b) => b.featured);
