/* MobileFrame.jsx — Frame de iOS minimal para presentar mockups */

const MobileFrame = ({ children, label, w = 390, h = 844 }) => (
  <div className="mf-wrap" data-screen-label={label}>
    {label && <div className="mf-label">{label}</div>}
    <div className="mf-device" style={{ width: w + 16, height: h + 16 }}>
      <div className="mf-notch"></div>
      <div className="mf-screen" style={{ width: w, height: h }}>
        {children}
      </div>
    </div>
  </div>
);

window.MobileFrame = MobileFrame;
