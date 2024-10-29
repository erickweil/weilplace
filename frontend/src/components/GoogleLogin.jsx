import styles from '@/styles/Pixels.module.css'
import { useEffect, useState } from 'react';
const GoogleLogin = (props) => {
    
    // https://levelup.gitconnected.com/everything-about-the-google-identity-service-gis-api-168df3498c5a
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;

        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    return <>
        <div className={`${styles.colorPicker}`} style={{backgroundColor: "transparent", display: "flex", justifyContent: "center"}}>
        <div className={`${styles.colorPickerTxt}`}>
            <div
                id="g_id_onload"
                data-client_id={process.env.NEXT_PUBLIC_OAUTH2_CLIENT_ID}
                data-context="signin"
                data-login_uri={process.env.NEXT_PUBLIC_OAUTH2_LOGIN_URI}
                data-ux_mode="popup"
                data-auto_prompt="false"
                data-state={"TESTE"}
                data-use_fedcm_for_prompt="true">
            </div>

            <div class="g_id_signin"
                data-type="standard"
                data-shape="pill"
                data-theme="outline"
                data-text="signin_with"
                data-size="large"
                data-locale="pt-BR"
                data-logo_alignment="left">
            </div>
        </div>
        </div>
    </>;
};

export default GoogleLogin;