import React from "react";

const Tracking: React.FunctionComponent = () => {
    return (
        <React.Fragment>
            <img alt="doubleclick" width="1" height="1"
                 src={`https://pubads.g.doubleclick.net/activity;dc_iu=/21612525419/DFPAudiencePixel;ord=${Math.random()*10000000000000};dc_seg=507368552?`}
            />
            <img alt="fb" height="1" width="1"
                 src="https://www.facebook.com/tr?id=1650870088530325&ev=PageView&noscript=1"/>
        </React.Fragment>
    )
};

export default Tracking;
