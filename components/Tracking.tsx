import React from "react";

const Tracking: React.FunctionComponent = () => {
    return (
        <div style={{ visibility: 'hidden', height: 0, overflow: 'hidden', position: 'relative'}}>
            <img alt="fb" height="1" width="1" style={{ position: 'absolute'}}
                 src="https://www.facebook.com/tr?id=1650870088530325&ev=PageView&noscript=1"/>
        </div>
    )
};

export default Tracking;
