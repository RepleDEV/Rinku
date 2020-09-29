#include <node.h>
#include <windows.h>

namespace winmanager {
    // v8 classes
    using v8::FunctionCallbackInfo;
    using v8::Isolate;
    using v8::Local;
    using v8::Object;
    using v8::String;
    using v8::Integer;
    using v8::Value;

    HWND storedWindow;
    bool hasStoredWindow = false;

    // Char array to string
    std::string charToString(char* arr, int size) { 
        int i;
        std::string res = ""; 
        for (i = 0; i < size; i++) { 
            res = res + arr[i]; 
        } 
        return res; 
    } 

    std::string GetWindowTitle(HWND window) {
        char wnd_title[256];
        GetWindowText(window, wnd_title, sizeof(wnd_title));
        
        return charToString(wnd_title, GetWindowTextLength(window) + 1);
    }

    // Get active window title
    std::string GetActiveWindowTitle() {
        return GetWindowTitle(GetForegroundWindow());
    }

    bool isForeground(HWND wind) {
        return wind == GetForegroundWindow();
    }

    /* 
    
        ==> MAIN NODE METHODS
    
    */
    void GetCurrentActiveWindowTitle(const FunctionCallbackInfo<Value>& args) {
        Isolate* isolate = args.GetIsolate();
        args.GetReturnValue().Set(
            String::NewFromUtf8(
                isolate, 
                GetActiveWindowTitle().c_str()
            ).ToLocalChecked()
        );
    }

    void StoreActiveWindow(const FunctionCallbackInfo<Value>& args) {
        Isolate* isolate = args.GetIsolate();
        storedWindow = GetForegroundWindow();
        args.GetReturnValue().Set(
            String::NewFromUtf8(
                isolate,
                ("Stored window. Window title: " + GetWindowTitle(storedWindow)).c_str()
            ).ToLocalChecked()
        );

        hasStoredWindow = true;
    }

    void ActivateStoredWindow(const FunctionCallbackInfo<Value>& args) {
        Isolate* isolate = args.GetIsolate();
        if (!hasStoredWindow) {
            args.GetReturnValue().Set(
                String::NewFromUtf8(
                    isolate,
                    "Haven't stored a window yet!"
                ).ToLocalChecked()
            );
        } else {
            if (!isForeground(storedWindow)) {
                // From: https://github.com/sentialx/node-window-manager/blob/master/lib/windows.cc#L319
                // License: https://github.com/sentialx/node-window-manager/blob/master/LICENSE
                SetForegroundWindow(storedWindow);
                
                HWND hCurWnd = GetForegroundWindow();
                DWORD dwMyID = GetCurrentThreadId();
                DWORD dwCurID = GetWindowThreadProcessId (hCurWnd, NULL);
                AttachThreadInput (dwCurID, dwMyID, TRUE);
                BringWindowToTop(storedWindow);
                SetForegroundWindow (storedWindow);
                AttachThreadInput (dwCurID, dwMyID, FALSE);
                SetFocus (storedWindow);
                SetActiveWindow (storedWindow);

                hasStoredWindow = false;

                args.GetReturnValue().Set(
                    String::NewFromUtf8(
                        isolate,
                        ("Changed window from: " + GetWindowTitle(hCurWnd) + " to: " + GetWindowTitle(storedWindow)).c_str()
                    ).ToLocalChecked()
                );
            } else {
                args.GetReturnValue().Set(
                    String::NewFromUtf8(
                        isolate,
                        "Current window is already at the saved window!"
                    ).ToLocalChecked()
                );
            }
        }
    }

    void CheckStoredWindow(const FunctionCallbackInfo<Value>& args) {
        Isolate* isolate = args.GetIsolate();
        if (!hasStoredWindow) {
            args.GetReturnValue().Set(
                String::NewFromUtf8(
                    isolate,
                    "Haven't stored a window yet!"
                ).ToLocalChecked()
            );
        } else {
            args.GetReturnValue().Set(
                String::NewFromUtf8(
                    isolate,
                    ("Current Stored Window Title: " + GetWindowTitle(storedWindow)).c_str()
                ).ToLocalChecked()
            );
        }
    }

    void init(Local<Object> exports) {
        NODE_SET_METHOD(exports, "getCurrentActiveWindowTitle", GetCurrentActiveWindowTitle);
        NODE_SET_METHOD(exports, "storeActiveWindow", StoreActiveWindow);
        NODE_SET_METHOD(exports, "activateStoredWindow", ActivateStoredWindow);
        NODE_SET_METHOD(exports, "checkStoredWindow", CheckStoredWindow);
    }

    NODE_MODULE(NODE_GYP_MODULE_NAME, init)
}