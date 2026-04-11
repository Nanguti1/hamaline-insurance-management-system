import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex size-10 items-center justify-center overflow-hidden rounded-md bg-white p-1 shadow-sm">
                <AppLogoIcon className="h-8 w-auto object-contain" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    Hamaline Insurance Agency
                </span>
            </div>
        </>
    );
}
