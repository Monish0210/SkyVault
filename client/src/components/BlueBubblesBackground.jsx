import React from 'react'

const BUBBLES = [
	{ left: '4%', size: '16px', duration: '18s', delay: '0s', opacity: 0.45 },
	{ left: '10%', size: '24px', duration: '26s', delay: '3s', opacity: 0.38 },
	{ left: '17%', size: '14px', duration: '22s', delay: '1s', opacity: 0.42 },
	{ left: '24%', size: '30px', duration: '30s', delay: '5s', opacity: 0.28 },
	{ left: '33%', size: '20px', duration: '24s', delay: '2s', opacity: 0.36 },
	{ left: '42%', size: '12px', duration: '19s', delay: '6s', opacity: 0.35 },
	{ left: '51%', size: '28px', duration: '28s', delay: '4s', opacity: 0.32 },
	{ left: '60%', size: '18px', duration: '21s', delay: '2.5s', opacity: 0.4 },
	{ left: '70%', size: '26px', duration: '25s', delay: '1.2s', opacity: 0.3 },
	{ left: '78%', size: '14px', duration: '20s', delay: '4.2s', opacity: 0.42 },
	{ left: '86%', size: '22px', duration: '27s', delay: '0.8s', opacity: 0.34 },
	{ left: '94%', size: '12px', duration: '17s', delay: '2.1s', opacity: 0.45 },
]

/**
 * Decorative animated background bubbles for blue-themed pages.
 * @returns {import('react').JSX.Element}
 */
function BlueBubblesBackground() {
	return (
		<div className="blue-bubble-field" aria-hidden="true">
			<div className="blue-bubble-glow blue-bubble-glow-top" />
			<div className="blue-bubble-glow blue-bubble-glow-bottom" />
			{BUBBLES.map((bubble, index) => (
				<span
					key={`${bubble.left}-${index}`}
					className="blue-bubble"
					style={{
						'--bubble-left': bubble.left,
						'--bubble-size': bubble.size,
						'--bubble-duration': bubble.duration,
						'--bubble-delay': bubble.delay,
						'--bubble-opacity': bubble.opacity,
					}}
				/>
			))}
		</div>
	)
}

export default BlueBubblesBackground
