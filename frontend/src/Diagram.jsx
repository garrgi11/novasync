import React, { useState, useEffect } from 'react'

const Diagram = () => {
  const [isAnimating, setIsAnimating] = useState(false)
  const [lineAnimation, setLineAnimation] = useState(false)
  const [firstSvgRotation, setFirstSvgRotation] = useState(false)
  const [secondSvgRotation, setSecondSvgRotation] = useState(false)
  const [meterValue, setMeterValue] = useState(0)

  const handleFillClick = () => {
    if (isAnimating) return // Prevent multiple clicks during animation
    
    setIsAnimating(true)
    setMeterValue(0)
    setFirstSvgRotation(false)
    setSecondSvgRotation(false)
    
    // Start line animation
    setLineAnimation(true)
    
    // First SVG rotates when line reaches ~30% of the path (around first curve)
    setTimeout(() => {
      setFirstSvgRotation(true)
    }, 600) // 30% of 2 seconds
    
    // Second SVG rotates when line reaches ~60% of the path (around second curve)
    setTimeout(() => {
      setSecondSvgRotation(true)
    }, 900) // 60% of 2 seconds
    
    // Meter animation starts when line completes
    setTimeout(() => {
      animateMeter()
    }, 2000) // When line animation completes
    
    // Reset all animations after 6 seconds
    setTimeout(() => {
      setIsAnimating(false)
      setLineAnimation(false)
      setFirstSvgRotation(false)
      setSecondSvgRotation(false)
      setMeterValue(0)
    }, 6000)
  }

  const animateMeter = () => {
    const targetValue = 570
    const duration = 1500 // 1.5 seconds
    const steps = 60
    const increment = targetValue / steps
    const stepDuration = duration / steps
    
    let currentStep = 0
    
    const timer = setInterval(() => {
      currentStep++
      const newValue = Math.min(Math.floor(increment * currentStep), targetValue)
      setMeterValue(newValue)
      
      if (currentStep >= steps) {
        clearInterval(timer)
      }
    }, stepDuration)
  }

  return (
    <div className=' flex mt-[5vw] mx-[5vw] gap-x-[1vw]'>
        <div className="w-1/5">
        <button 
          className='text-[48px] text-white px-[70px] rounded-[50px] w-full text-center h-[80px] fillButton'
          onClick={handleFillClick}
          disabled={isAnimating}
        >
          Fill
        </button>

        </div>
        <div className='w-[45%] pt-[40px] pb-[49px] relative'>
        <svg className='w-full' viewBox="0 0 329 318" fill="none" xmlns="http://www.w3.org/2000/svg">
<path 
  d="M0 2H111.991C111.991 2 120.852 2 237.5 2C354.148 2 358.653 154.43 237.5 154.43C116.347 154.43 245.179 154.43 104 154.43C-37.1788 154.43 -24.1623 316 104 316C232.162 316 323.5 316 323.5 316" 
  stroke="#FF5900" 
  strokeWidth="4" 
  strokeDasharray="8 8"
  className="drawing-animation"
  style={{
    strokeDasharray: '1300',
    strokeDashoffset: lineAnimation ? '0' : '1300',
    transition: lineAnimation ? 'stroke-dashoffset 2s ease-in-out' : 'none'
  }}
/>
        </svg>
        <svg className='w-full absolute inset-0 top-[40px]'  viewBox="0 0 329 318" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 2H111.991C111.991 2 120.852 2 237.5 2C354.148 2 358.653 154.43 237.5 154.43C116.347 154.43 245.179 154.43 104 154.43C-37.1788 154.43 -24.1623 316 104 316C232.162 316 323.5 316 323.5 316" stroke="#FF5900" stroke-width="4" stroke-dasharray="8 8"/>
</svg>

        <div className="absolute top-[0px] w-[44px] right-[200px]"><p className="text-[24px] text-gray-500 relative">USD</p></div>
        <div className="absolute top-[200px] w-[44px] right-[200px]"><p className="text-[24px] text-gray-500 relative">ETH</p></div>
        <div className="absolute top-[400px] w-[44px] right-[200px]"><p className="text-[24px] text-gray-500 relative">RWAs</p></div>

        {/* First SVG overlay */}
        <svg 
          className='absolute top-[100px] w-[44px] right-[-17px]' 
          viewBox="0 0 43 43" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{
            transform: firstSvgRotation ? 'rotate(360deg)' : 'rotate(0deg)',
            transition: firstSvgRotation ? 'transform 0.7s ease-in-out' : 'none'
          }}
        >
<rect width="43" height="43" rx="21.5" fill="white"/>
<path d="M14.3333 6.27084V29.5625M14.3333 6.27084L6.27081 14.0347M14.3333 6.27084L22.3958 14.0347" stroke="#FF5900" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M30.4583 36.7292V13.4375M30.4583 36.7292L38.5208 28.9653M30.4583 36.7292L22.3958 28.9653" stroke="#FF5900" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

        {/* Second SVG overlay */}
        <svg 
          className='absolute bottom-[130px] w-[44px] left-[-17px]' 
          viewBox="0 0 43 43" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{
            transform: secondSvgRotation ? 'rotate(360deg)' : 'rotate(0deg)',
            transition: secondSvgRotation ? 'transform 0.7s ease-in-out' : 'none'
          }}
        >
<rect width="43" height="43" rx="21.5" fill="white"/>
<path d="M14.3333 6.27084V29.5625M14.3333 6.27084L6.27081 14.0347M14.3333 6.27084L22.3958 14.0347" stroke="#FF5900" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M30.4583 36.7292V13.4375M30.4583 36.7292L38.5208 28.9653M30.4583 36.7292L22.3958 28.9653" stroke="#FF5900" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

        </div>
        <div className='w-[35%] flex flex-col justify-end'>

            <div className="meter flex bg-white p-[10px] gap-x-[10px] relative border-[1px] border-gray-200 h-[118px] rounded-[15px]">
                <div className="innershadow w-full py-[25px] text-[48px] leading-[1em] rounded-[10px]">$</div>
                <div className="innershadow w-full py-[25px] text-[48px] leading-[1em] rounded-[10px]">
                  {Math.floor(meterValue / 100)}
                </div>
                <div className="innershadow w-full py-[25px] text-[48px] leading-[1em] rounded-[10px]">
                  {Math.floor((meterValue % 100) / 10)}
                </div>
                <div className="innershadow w-full py-[25px] text-[48px] leading-[1em] rounded-[10px]">
                  {meterValue % 10}
                </div>
            </div>
        </div>
    </div>
  )
}

export default Diagram
