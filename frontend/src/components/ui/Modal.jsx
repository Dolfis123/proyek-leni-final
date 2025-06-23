// src/components/ui/Modal.jsx
import React from 'react';

const Modal = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none bg-gray-900 bg-opacity-50">
            <div className="relative w-auto my-6 mx-auto max-w-3xl">
                {/*content*/}
                <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                    {/*header*/}
                    <div className="flex items-start justify-between p-5 border-b border-solid border-gray-200 rounded-t">
                        <h3 className="text-xl font-semibold text-gray-800">
                            {title}
                        </h3>
                        <button
                            className="p-1 ml-auto bg-transparent border-0 text-gray-700 opacity-70 float-right text-3xl leading-none font-semibold outline-none focus:outline-none hover:text-red-500"
                            onClick={onClose}
                        >
                            <span className="bg-transparent h-6 w-6 text-2xl block outline-none focus:outline-none">
                                ×
                            </span>
                        </button>
                    </div>
                    {/*body*/}
                    <div className="relative p-6 flex-auto">
                        {children}
                    </div>
                    {/*footer (optional, can be added if needed)*/}
                    {/* <div className="flex items-center justify-end p-6 border-t border-solid border-gray-200 rounded-b">
                        <button
                            className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                            type="button"
                            onClick={onClose}
                        >
                            Close
                        </button>
                        <button
                            className="bg-emerald-500 text-white active:bg-emerald-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                            type="button"
                            onClick={onClose}
                        >
                            Save Changes
                        </button>
                    </div> */}
                </div>
            </div>
        </div>
    );
};

export default Modal;