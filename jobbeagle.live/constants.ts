import { JobData } from './types';

export const INITIAL_JOBS: JobData[] = [
  {
    id: 'google-01',
    companyName: 'Google',
    jobTitle: 'Senior Software Engineer',
    location: 'Mountain View, CA',
    salary: 'USD 180k - 250k / yr',
    description: 'Join the team building the future of AI. We are looking for experienced engineers to work on Gemini and large language models.\n\nKey Responsibilities:\n- Design and develop large-scale machine learning systems.\n- Optimize model performance for real-time applications.\n- Collaborate with cross-functional teams to integrate AI features into Google products.\n\nRequirements:\n- 5+ years of software development experience.\n- Proficiency in Python, C++, or Java.\n- Experience with TensorFlow, PyTorch, or JAX.',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    tags: ['AI', 'React', 'Python'],
    logoUrl: 'https://logo.clearbit.com/google.com',
    contactEmail: 'careers@google.com'
  },
  {
    id: 'apple-01',
    companyName: 'Apple',
    jobTitle: 'iOS Developer',
    location: 'Cupertino, CA',
    salary: 'USD 160k - 230k / yr',
    description: 'Design and build applications for the iOS platform. Ensure the performance, quality, and responsiveness of applications.\n\nKey Responsibilities:\n- Develop high-quality features for iOS using Swift.\n- Work closely with designers to implement pixel-perfect UIs.\n- Maintain code quality through rigorous testing and code reviews.\n\nRequirements:\n- Strong knowledge of Swift and Objective-C.\n- Experience with iOS frameworks like UIKit and SwiftUI.\n- Familiarity with RESTful APIs to connect iOS applications to back-end services.',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    tags: ['Swift', 'iOS', 'Mobile'],
    logoUrl: 'https://logo.clearbit.com/apple.com',
    contactEmail: 'recruiting@apple.com'
  },
  {
    id: 'microsoft-01',
    companyName: 'Microsoft',
    jobTitle: 'Cloud Architect (Azure)',
    location: 'Redmond, WA',
    salary: 'USD 150k - 220k / yr',
    description: 'Lead the design and implementation of secure, scalable, and reliable cloud solutions on Azure.\n\nKey Responsibilities:\n- Architect enterprise-grade cloud solutions for global clients.\n- Drive cloud transformation and migration strategies.\n- Mentor junior engineers and promote best practices in cloud engineering.\n\nRequirements:\n- Extensive experience with Microsoft Azure services.\n- Strong understanding of cloud security and compliance.\n- Azure Solutions Architect Expert certification is a plus.',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    tags: ['Azure', 'Cloud', 'Architecture'],
    logoUrl: 'https://logo.clearbit.com/microsoft.com',
    contactEmail: 'azure-hiring@microsoft.com'
  },
  {
    id: 'amazon-01',
    companyName: 'Amazon',
    jobTitle: 'Operations Manager',
    location: 'Seattle, WA',
    salary: 'USD 130k - 190k / yr',
    description: 'Lead a team of operations managers and associates in a fast-paced environment. Drive process improvements.\n\nKey Responsibilities:\n- Oversee daily operations of a large-scale fulfillment center.\n- Analyze operational data to identify bottlenecks and implement efficiency gains.\n- Manage staff safety, performance, and professional development.\n\nRequirements:\n- Proven leadership experience in logistics or manufacturing.\n- Strong analytical skills and data-driven decision-making.\n- Ability to handle pressure in a high-growth environment.',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    tags: ['Operations', 'Logistics', 'Leadership'],
    logoUrl: 'https://logo.clearbit.com/amazon.com',
    contactEmail: 'ops-talent@amazon.com'
  },
  {
    id: 'meta-01',
    companyName: 'Meta',
    jobTitle: 'Product Designer',
    location: 'Menlo Park, CA',
    salary: 'USD 170k - 240k / yr',
    description: 'Design simple, easy-to-use flows and experiences that delight our users. Work on Facebook, Instagram, or WhatsApp.\n\nKey Responsibilities:\n- Create innovative designs for social networking products.\n- Conduct user research and translate findings into design iterations.\n- Prototype interactions and collaborate with engineers for implementation.\n\nRequirements:\n- Strong portfolio demonstrating UX/UI design excellence.\n- Proficiency in Figma, Sketch, or Adobe Creative Suite.\n- Passion for connecting people through technology.',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    tags: ['Design', 'UX/UI', 'Social'],
    logoUrl: 'https://logo.clearbit.com/meta.com',
    contactEmail: 'design-jobs@meta.com'
  },
  {
    id: 'tsmc-01',
    companyName: 'TSMC (台積電)',
    jobTitle: 'R&D Engineer',
    location: 'Hsinchu, Taiwan',
    salary: 'TWD 2M - 4M / yr',
    description: 'Work on the cutting edge of semiconductor technology. Advanced process development and integration.\n\nKey Responsibilities:\n- Develop next-generation semiconductor manufacturing processes.\n- Conduct experiments to optimize yield and performance.\n- Research new materials and lithography techniques.\n\nRequirements:\n- PhD or Master\'s degree in Material Science, Physics, or Electrical Engineering.\n- Strong problem-solving skills and attention to detail.\n- Fluent in English and Mandarin.',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    tags: ['Semiconductor', 'R&D', 'Engineering'],
    logoUrl: 'https://logo.clearbit.com/tsmc.com',
    contactEmail: 'hr@tsmc.com'
  },
  {
    id: 'mediatek-01',
    companyName: 'MediaTek (聯發科)',
    jobTitle: 'IC Design Engineer',
    location: 'Hsinchu, Taiwan',
    salary: 'TWD 1.8M - 3.5M / yr',
    description: 'Design high-performance ICs for mobile, home entertainment, and IoT devices.\n\nKey Responsibilities:\n- Architect and design digital/analog IC circuits.\n- Perform logic synthesis and timing analysis.\n- Collaborate on SoC integration and verification.\n\nRequirements:\n- Experience with Verilog/VHDL and EDA tools.\n- Understanding of computer architecture and low-power design.\n- Proactive attitude and teamwork spirit.',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    tags: ['IC Design', 'Verilog', 'Hardware'],
    logoUrl: 'https://logo.clearbit.com/mediatek.com',
    contactEmail: 'talent@mediatek.com'
  },
  {
    id: 'foxconn-01',
    companyName: 'Foxconn (鴻海)',
    jobTitle: 'Project Manager',
    location: 'Taipei, Taiwan',
    salary: 'TWD 1.2M - 2M / yr',
    description: 'Manage global manufacturing projects for top tech clients. Coordinate between engineering, supply chain, and production.\n\nKey Responsibilities:\n- Lead end-to-end product development projects.\n- Manage client relationships and ensure project timelines are met.\n- Coordinate resources across different global manufacturing sites.\n\nRequirements:\n- 3+ years of project management experience in electronics manufacturing.\n- PMP certification is a plus.\n- Excellent communication and negotiation skills.',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    tags: ['Manufacturing', 'PM', 'Global'],
    logoUrl: 'https://logo.clearbit.com/foxconn.com',
    contactEmail: 'pm-hiring@foxconn.com'
  },
  {
    id: 'fubon-01',
    companyName: 'Fubon Financial (富邦金控)',
    jobTitle: 'Investment Analyst',
    location: 'Taipei, Taiwan',
    salary: 'TWD 1M - 1.8M / yr',
    description: 'Analyze market trends and investment opportunities. Manage portfolio performance and risk.\n\nKey Responsibilities:\n- Conduct fundamental analysis on global markets and sectors.\n- Build financial models to evaluate investment returns.\n- Present investment recommendations to the committee.\n\nRequirements:\n- Strong analytical background in Finance or Economics.\n- CFA candidate preferred.\n- Proficiency in Bloomberg terminal and financial software.',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    tags: ['Finance', 'Investment', 'Banking'],
    logoUrl: 'https://logo.clearbit.com/fubon.com',
    contactEmail: 'hr.finance@fubon.com'
  },
  {
    id: 'cht-01',
    companyName: 'Chunghwa Telecom (中華電信)',
    jobTitle: 'Network Engineer',
    location: 'Taipei, Taiwan',
    salary: 'TWD 900k - 1.5M / yr',
    description: 'Maintain and optimize the largest telecommunications network in Taiwan. 5G infrastructure development.\n\nKey Responsibilities:\n- Monitor and troubleshoot core network infrastructure.\n- Design and implement network upgrades and security measures.\n- Optimize 5G network performance for commercial launch.\n\nRequirements:\n- CCNA/CCNP certification preferred.\n- Experience with routing protocols (BGP, OSPF).\n- Strong interest in 5G and IoT technologies.',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    tags: ['Telecom', 'Network', '5G'],
    logoUrl: 'https://logo.clearbit.com/cht.com.tw',
    contactEmail: 'network-talent@cht.com.tw'
  }
];