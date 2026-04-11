import { useState, type ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    const [src, setSrc] = useState('/hamline-logo.png');

    return (
        <img
            {...props}
            src={src}
            alt="Hamline Insurance Agency"
            onError={() => {
                if (src === '/hamline-logo.png') {
                    setSrc('/logo.png');
                    return;
                }
                if (src === '/logo.png') {
                    setSrc('/apple-touch-icon.png');
                }
            }}
        />
    );
}
