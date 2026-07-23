"use client"

import { useEffect, useState } from "react"
import { ecommerceApi } from "@/lib/api"

export function WhatsAppButton() {
    const [messengerUrl, setMessengerUrl] = useState("https://m.me/ferdous.textile")

    useEffect(() => {
        ecommerceApi.getHomePageSettings().then((settings) => {
            const fbUrl = (settings?.footer_facebook_url || "").trim()
            if (fbUrl.includes("m.me/")) {
                // Already a Messenger link, use directly
                setMessengerUrl(fbUrl)
            } else if (fbUrl) {
                // Try to extract page username from Facebook URL
                const match = fbUrl.match(/(?:facebook\.com\/)([^/?#]+)/i)
                if (match && match[1] && !match[1].startsWith('share') && !match[1].startsWith('profile.php') && !match[1].startsWith('sharer')) {
                    setMessengerUrl(`https://m.me/${match[1]}`)
                }
                // If extraction fails, keep the default m.me/ferdous.textile
            }
            // If no fbUrl from settings, keep the default m.me/ferdous.textile
        }).catch(() => null)
    }, [])

    const handleMessengerClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (typeof window === "undefined") return
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
        if (isMobile) {
            e.preventDefault()
            // If it's an m.me link, open native fb-messenger app
            if (messengerUrl.includes("m.me/")) {
                const username = messengerUrl.split("m.me/")[1]?.split("?")[0]?.split("/")[0]
                window.location.href = `fb-messenger://user-thread/${username}`
                setTimeout(() => {
                    window.location.href = messengerUrl
                }, 800)
            } else {
                // Try opening in native Messenger/Facebook app on mobile first
                window.location.href = `fb-messenger://`
                setTimeout(() => {
                    window.open(messengerUrl, "_blank")
                }, 800)
            }
        }
    }

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col gap-3 items-center justify-center pointer-events-auto">
            {/* Facebook Messenger Floating Button */}
            <div className="relative flex items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0084FF] opacity-60"></span>
                <a
                    href={messengerUrl}
                    onClick={handleMessengerClick}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-tr from-[#00C6FF] to-[#0084FF] text-white shadow-xl transition-transform hover:scale-110 shrink-0"
                    aria-label="Chat on Messenger"
                    title="Chat on Messenger"
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-6 w-6 sm:h-7 sm:w-7"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.304 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26 6.559-6.96 3.127 3.26 5.89-3.26-6.558 6.96z"/>
                    </svg>
                </a>
            </div>

            {/* WhatsApp Floating Button */}
            <div className="relative flex items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25D366] opacity-75"></span>
                <a
                    href="https://wa.me/8801896285447"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-transform hover:scale-110 shrink-0"
                    aria-label="Chat on WhatsApp"
                    title="Chat on WhatsApp"
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-6 w-6 sm:h-8 sm:w-8"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M17.472 14.382C17.112 14.192 15.283 13.252 14.938 13.136C14.616 13.012 14.363 12.943 14.12 13.314C13.865 13.682 13.149 14.518 12.929 14.766C12.715 15.011 12.493 15.044 12.138 14.862C11.782 14.686 10.636 14.305 9.28 13.09C8.214 12.136 7.494 10.957 7.278 10.584C7.065 10.211 7.257 10.012 7.435 9.835C7.594 9.676 7.788 9.421 7.965 9.213C8.145 9.006 8.204 8.847 8.322 8.608C8.442 8.375 8.381 8.169 8.291 7.994C8.203 7.821 7.483 6.046 7.185 5.33C6.895 4.633 6.602 4.706 6.391 4.717C6.195 4.721 5.972 4.721 5.75 4.721C5.526 4.721 5.165 4.805 4.86 5.141C4.551 5.474 3.687 6.289 3.687 7.947C3.687 9.605 4.893 11.205 5.068 11.439C5.241 11.669 7.419 15.275 10.909 16.591C13.692 17.65 14.26 17.518 14.863 17.425C15.65 17.304 17.112 16.529 17.414 15.679C17.712 14.829 17.712 14.103 17.618 13.945C17.525 13.784 17.271 13.676 17.472 14.382Z"
                        />
                        <path
                            d="M12.041 0C5.405 0 0 5.405 0 12.04C0 14.36 0.659 16.505 1.791 18.35L0.5 23.5L5.786 22.139C7.593 23.187 9.771 23.8 12.041 23.8C18.667 23.8 24.08 18.397 24.08 11.751C24.08 5.756 19.349 1.144 13.359 1.144L12.041 0Z"
                            fillRule="evenodd"
                            clipRule="evenodd"
                            className="opacity-0"
                        />
                        <path
                            d="M20.52 3.561C18.258 1.297 15.251 0.052 12.083 0.052C5.485 0.052 0.117 5.42 0.117 12.019C0.117 14.127 0.665 16.19 1.705 17.993L0 24.21L6.36 22.541C8.105 23.491 10.076 23.992 12.079 23.992H12.084C18.68 23.992 24.05 18.625 24.05 12.022C24.05 8.825 22.805 5.819 20.52 3.561ZM12.084 21.968C10.297 21.968 8.549 21.489 7.021 20.584L6.658 20.369L2.883 21.361L3.89 17.683L3.654 17.308C2.658 15.723 2.133 13.889 2.133 12.018C2.133 6.532 6.598 2.067 12.088 2.067C14.746 2.067 17.245 3.102 19.123 4.982C21.002 6.862 22.036 9.36 22.036 12.022C22.036 17.509 17.575 21.968 12.084 21.968Z"
                        />
                    </svg>
                </a>
            </div>
        </div>
    )
}

