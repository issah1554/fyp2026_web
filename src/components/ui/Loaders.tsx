import React from 'react';

interface LoaderProps {
    type?: 'spin' | 'dots' | 'glow' | 'spin-dots' | 'spin-smooth' | 'spin-double' | 'bars' | 'bars2' | 'dots-3';
    size?: number;
    color?: string;
    text?: string;
    textPosition?: 'bottom' | 'top' | 'left' | 'right';
}

const Loader: React.FC<LoaderProps> = ({
    type = 'spin',
    size = 50,
    color,
    text,
    textPosition = 'bottom'
}) => {
    const style: React.CSSProperties & Record<"--loader-color", string> = {
        width: size,
        height: size,
        "--loader-color": color || 'var(--primary-500)'
    };

    const loaderContent = (() => {
        switch (type) {
            case 'dots':
                return (
                    <>
                        <style>{`
                            .loader-dots {
                              display: flex;
                              justify-content: space-between;
                              align-items: center;
                              width: 60%;
                              height: 25%;
                            }
                            .loader-dots span {
                              display: block;
                              width: 10px;
                              height: 10px;
                              background-color: var(--loader-color, var(--primary-500));
                              border-radius: 50%;
                              animation: bounce 0.6s infinite alternate;
                            }
                            .loader-dots span:nth-child(2) { animation-delay: 0.2s; }
                            .loader-dots span:nth-child(3) { animation-delay: 0.4s; }
                            @keyframes bounce { to { transform: translateY(-50%); } }
                        `}</style>
                        <div className="loader-dots" style={style}>
                            <span></span><span></span><span></span>
                        </div>
                    </>
                );
            case 'spin-dots':
                return (
                    <>
                        <style>{`
                            .spin-dots {
                              width: 50px;
                              aspect-ratio: 1;
                              display:grid;
                              -webkit-mask: conic-gradient(from 15deg,#0000,#000);
                              animation: l26 1s infinite steps(12);
                            }
                            .spin-dots,
                            .spin-dots:before,
                            .spin-dots:after{
                              background:
                                radial-gradient(closest-side at 50% 12.5%,
                                var(--loader-color, var(--primary-500)) 96%,#0000) 50% 0/20% 80% repeat-y,
                                radial-gradient(closest-side at 12.5% 50%,
                                var(--loader-color, var(--primary-500)) 96%,#0000) 0 50%/80% 20% repeat-x;
                            }
                            .spin-dots:before,
                            .spin-dots:after {
                              content: "";
                              grid-area: 1/1;
                              transform: rotate(30deg);
                            }
                            .spin-dots:after {
                              transform: rotate(60deg);
                            }
                            @keyframes l26 {100% {transform:rotate(1turn)}}
                        `}</style>
                        <div className="spin-dots" style={style}></div>
                    </>
                );
            case 'glow':
                return (
                    <>
                        <style>{`
                            .loader-glow {
                              height: 80px;
                              aspect-ratio: 1;
                              padding: 4px;
                              border-radius: 50%;
                              box-sizing: border-box;
                              position: relative;
                              mask: conic-gradient(#000 0 0) content-box exclude, conic-gradient(#000 0 0);
                              filter: blur(5px);
                            }
                            .loader-glow:before {
                              content: "";
                              position: absolute;
                              inset: 0;
                              background: conic-gradient(#0000 35%,var(--loader-color, var(--primary-500)), #0000 65%);
                              animation: glow 1.5s linear infinite;
                            }
                            @keyframes glow { to { rotate: 1turn; } }
                        `}</style>
                        <div className="loader-glow" style={style}></div>
                    </>
                );
            case 'spin-smooth':
                return (
                    <>
                        <style>{`
                            .spin-smooth {
                            width: 40px;
                            aspect-ratio: 1;
                            border-radius: 50%;
                            background: 
                                radial-gradient(farthest-side,var(--primary-500), 94%,#0000) top/8px 8px no-repeat,
                                conic-gradient(#0000 30%,var(--primary-500));
                            -webkit-mask: radial-gradient(farthest-side,#0000 calc(100% - 8px),#000 0);
                            animation: l13 1s infinite linear;
                            }
                            @keyframes l13{ 
                            100%{transform: rotate(1turn)}
                                }
                        `}</style>
                        <div className="spin-smooth" style={style}></div>
                    </>
                );
            case 'spin-double':
                return (
                    <>
                        <style>{`
                            .spin-double {
                            width: 50px;
                            aspect-ratio: 1;
                            border-radius: 50%;
                            border: 2px solid var(--primary-100);
                            border-right:3px solid var(--primary-500);
                            animation: l2 1s infinite linear;
                            }
                            @keyframes l2 {to{transform: rotate(1turn)}}
                        `}</style>
                        <div className="spin-double" style={style}></div>
                    </>
                );

            case 'bars':
                return (
                    <>
                        <style>{`
                            .bars {
                                width: 45px;
                                aspect-ratio: .75;
                                --c: no-repeat linear-gradient(var(--primary-500) 0 0);
                                background: 
                                    var(--c) 0%   50%,
                                    var(--c) 50%  50%,
                                    var(--c) 100% 50%;
                                animation: l7 1.2s infinite linear alternate;
                            }
                            @keyframes l7 {
                                0%  {background-size: 20% 50% ,20% 50% ,20% 50% }
                                20% {background-size: 20% 20% ,20% 50% ,20% 50% }
                                40% {background-size: 20% 100%,20% 20% ,20% 50% }
                                60% {background-size: 20% 50% ,20% 100%,20% 20% }
                                80% {background-size: 20% 50% ,20% 50% ,20% 100%}
                                100%{background-size: 20% 50% ,20% 50% ,20% 50% }
                            }
                        `}</style>
                        <div className="bars" style={style}></div>
                    </>
                );

            case 'bars2':
                return (
                    <>
                        <style>{`
                            .bars2 {
                            width: 45px;
                            aspect-ratio: 1;
                            --c: no-repeat linear-gradient(var(--primary-500) 0 0);
                            background: 
                                var(--c) 0%   50%,
                                var(--c) 50%  50%,
                                var(--c) 100% 50%;
                            background-size: 20% 100%;
                            animation: l1 1.2s infinite linear;
                            }
                            @keyframes l1 {
                            0%  {background-size: 20% 100%,20% 100%,20% 100%}
                            33% {background-size: 20% 10% ,20% 100%,20% 100%}
                            50% {background-size: 20% 100%,20% 10% ,20% 100%}
                            66% {background-size: 20% 100%,20% 100%,20% 10% }
                            100%{background-size: 20% 100%,20% 100%,20% 100%}
                            }
                        `}</style>
                        <div className="bars2" style={style}></div>
                    </>
                );

            case 'dots-3':
                return (
                    <>
                        <style>{`
                            .dots-3 {
                            width: 40px;
                            aspect-ratio: 1.154;
                            --_g: no-repeat radial-gradient(farthest-side,var(--primary-500) 80%,#0000);
                            background: 
                                var(--_g) 50%  0,
                                var(--_g) 0    100%,
                                var(--_g) 100% 100%;
                            background-size: 35% calc(35%*1.154);
                            animation: l16 1.2s infinite;
                            }
                            @keyframes l16{ 
                                50%,100% {background-position: 100% 100%,50% 0,0 100%} 
                            }
                        `}</style>
                        <div className="dots-3" style={style}></div>
                    </>
                );

            default:
                return (
                    <>
                        <style>{`
                            .loader-spin {
                              width: 50px;
                              padding: 4px;
                              aspect-ratio: 1;
                              border-radius: 50%;
                              background: var(--loader-color, var(--db-primary-light));
                              --_m: conic-gradient(#0000 10%, #000), linear-gradient(#000 0 0) content-box;
                              -webkit-mask: var(--_m);
                              mask: var(--_m);
                              -webkit-mask-composite: source-out;
                              mask-composite: subtract;
                              animation: spin 1s infinite linear;
                            }
                            @keyframes spin { to { transform: rotate(1turn); } }
                        `}</style>
                        <div className="loader-spin" style={style}></div>
                    </>
                );
        }
    })();

    // Flex direction logic based on textPosition
    const direction =
        textPosition === 'top'
            ? 'column-reverse'
            : textPosition === 'bottom'
                ? 'column'
                : textPosition === 'left'
                    ? 'row-reverse'
                    : 'row';

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: direction,
                alignItems: 'center',
                gap: text ? '8px' : 0
            }}
        >
            {loaderContent}
            {text && (
                <span style={{ color: color || 'var(--primary-500)' }}>
                    {text}
                </span>
            )}
        </div>
    );
};

export default Loader;
