"use client"

import { useState } from "react"

interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    question: "What is FounderOS?",
    answer:
      "FounderOS is a founder intelligence platform that turns public web pages into structured startup signals. It helps founders monitor competitors, research sales prospects, and discover relevant funding opportunities — all from one shared command center.",
  },
  {
    question: "How does the competitor tracking work?",
    answer:
      "You add any public URL — a pricing page, changelog, hiring page, or product announcement. FounderOS extracts and scores meaningful changes, then surfaces them in your competitor feed with a significance score and a suggested action for each change.",
  },
  {
    question: "What does the Sales Prospect Agent produce?",
    answer:
      "For any company website you add, the Prospect Agent returns a structured brief: company category, likely stage, hiring and expansion signals, a fit score, and a recommended outreach angle. It turns an hour of research into a 30-second read.",
  },
  {
    question: "How does the VC Grant Scout work?",
    answer:
      "You set up a startup profile — sector, stage, geography, and fundraising preference. FounderOS matches public accelerator and grant programs against your profile, ranks them by fit score, and highlights upcoming deadlines so you never miss an opportunity.",
  },
  {
    question: "Does it require API keys or external integrations?",
    answer:
      "No. FounderOS works entirely from public URLs. There are no OAuth flows, no CRM connections required, and no credentials to manage. Add a URL, get structured intelligence back.",
  },
  {
    question: "How do I get started?",
    answer:
      "Click 'Open dashboard', then go to Settings to add a few public source URLs. Your first signals will appear immediately in demo mode — no credit card or external credentials required.",
  },
]

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  return (
    <div className="w-full flex justify-center items-start">
      <div className="flex-1 px-4 md:px-12 py-16 md:py-20 flex flex-col lg:flex-row justify-start items-start gap-6 lg:gap-12">
        {/* Left Column - Header */}
        <div className="w-full lg:flex-1 flex flex-col justify-center items-start gap-4 lg:py-5">
          <div className="w-full flex flex-col justify-center text-[#49423D] font-semibold leading-tight md:leading-[44px] font-sans text-4xl tracking-tight">
            Frequently Asked Questions
          </div>
          <div className="w-full text-[#605A57] text-base font-normal leading-7 font-sans">
            Everything you need to know about FounderOS
            <br className="hidden md:block" />
            and how it fits into your founder workflow.
          </div>
        </div>

        {/* Right Column - FAQ Items */}
        <div className="w-full lg:flex-1 flex flex-col justify-center items-center">
          <div className="w-full flex flex-col">
            {faqData.map((item, index) => {
              const isOpen = openItems.includes(index)

              return (
                <div key={index} className="w-full border-b border-[rgba(73,66,61,0.16)] overflow-hidden">
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full px-5 py-[18px] flex justify-between items-center gap-5 text-left hover:bg-[rgba(73,66,61,0.02)] transition-colors duration-200"
                    aria-expanded={isOpen}
                  >
                    <div className="flex-1 text-[#49423D] text-base font-medium leading-6 font-sans">
                      {item.question}
                    </div>
                    <div className="flex justify-center items-center">
                      <ChevronDownIcon
                        className={`w-6 h-6 text-[rgba(73,66,61,0.60)] transition-transform duration-300 ease-in-out ${
                          isOpen ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </div>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-5 pb-[18px] text-[#605A57] text-sm font-normal leading-6 font-sans">
                      {item.answer}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
