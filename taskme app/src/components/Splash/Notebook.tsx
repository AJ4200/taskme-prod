import React from "react";

const Notebook: React.FC = () => {

 
  return (
    <div className="canvas">
      <div className="notebook-loader">
        <div className="cover"></div>
        <div className="page one">
          <p>
            Task.ME
            <br />
            <span className="text-lg"> alpha!</span>
          </p>
        </div>
        <div className="page two"></div>
        <div className="page three"></div>
        <div className="page four"></div>
      </div>
      <div className="pencil">
        <div className="edge"></div>
      </div>
    </div>
  );
};
export default Notebook;
