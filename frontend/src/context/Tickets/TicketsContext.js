import React, { useState, useEffect, createContext } from "react";
import { useHistory } from "react-router-dom";

const TicketsContext = createContext();

/** Setter estável: consumidores não re-renderizam quando só `currentTicket` muda (ex.: lista de tickets). */
const TicketsSetContext = createContext();

const TicketsContextProvider = ({ children }) => {
	const [currentTicket, setCurrentTicket] = useState({ id: null, code: null });
    const history = useHistory();

    useEffect(() => {
        if (currentTicket.id !== null) {
            history.push(`/tickets/${currentTicket.uuid}`);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTicket])

	return (
		<TicketsSetContext.Provider value={setCurrentTicket}>
			<TicketsContext.Provider
				value={{ currentTicket, setCurrentTicket }}
			>
				{children}
			</TicketsContext.Provider>
		</TicketsSetContext.Provider>
	);
};

export { TicketsContext, TicketsSetContext, TicketsContextProvider };
