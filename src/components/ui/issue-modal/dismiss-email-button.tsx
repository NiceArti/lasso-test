import { useState } from "react";
import { Button } from "../button";
import { IoIosTimer } from "react-icons/io";
import { TbHours24 } from "react-icons/tb";


export const DismissEmailButton = ({
    email,
    onClick
}: {
    email: string,
    onClick?: (dismiss: boolean) => void
}) => {
    const [isDismissed, setDismissed] = useState<boolean>(false);

    return (
        <div key={email} className="flex items-center justify-between">
            <span className="text-sm">{email}</span>

            <Button
                onClick={() => {
                    onClick?.(!isDismissed);
                    setDismissed(!isDismissed);
                }}
                className="text-xs text-white/40 hover:text-white transition"
            >
                {isDismissed ? (<><IoIosTimer /> Dismissed</>) : (<><TbHours24 /> Dismiss 24h</>)}
            </Button>
        </div>
    );
} 