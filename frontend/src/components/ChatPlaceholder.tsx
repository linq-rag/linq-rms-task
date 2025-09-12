import React, { useState } from 'react'

const ChatPlaceholder: React.FC = () => {
  const [inputText, setInputText] = useState('')

  return (
    <div className="w-full inline-flex flex-col items-start rounded-xl lg:min-h-14">
      <form className="w-full lg:min-h-12 group select-none">
        <div className="relative bg-white border border-gray-300 rounded-lg px-4 pt-4 pb-3 lg:min-h-[56px]">
          {/* Main textarea area */}
          <div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={true}
              placeholder="Not Implemented"
              className="pl-3 pr-20 m-0 w-full resize-none bg-transparent py-[10px] text-[15px] placeholder:text-gray-500 outline-none lg:leading-[19px] lg:px-0 lg:py-0 cursor-not-allowed opacity-75"
              rows={2}
            />
          </div>

          {/* Bottom action bar */}
          <div className="flex items-center justify-between gap-3 mt-2">
            <div className="flex-1 select-none"></div>
            
            <div className="flex flex-row gap-4">
              {/* Action buttons - disabled for MVP */}
              <div className="inline-flex gap-2">
                <button
                  type="button"
                  disabled={true}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-400 rounded-md cursor-not-allowed"
                >
                  Sources
                </button>
                <button
                  type="button"
                  disabled={true}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-400 rounded-md cursor-not-allowed"
                >
                  Files
                </button>
              </div>

              {/* Send button */}
              <button
                type="button"
                disabled={true}
                className="rounded-full cursor-not-allowed p-1.5 w-8 h-8 bg-gray-200"
              >
                <svg 
                  className="mx-auto fill-gray-400" 
                  height={18} 
                  width={18} 
                  viewBox="0 0 24 24"
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default ChatPlaceholder