import { supabase } from './supabase';

// WebAuthn utilities for biometric authentication
export async function isWebAuthnSupported(): Promise<boolean> {
  return !!(
    window.PublicKeyCredential &&
    navigator.credentials &&
    typeof navigator.credentials.create === 'function'
  );
}

export async function registerWebAuthn(userId: string, userName: string) {
  try {
    // Call Edge Function to get challenge
    const { data: challengeData, error: challengeError } = await supabase.functions.invoke(
      'webauthn-register-challenge',
      {
        body: { userId, userName },
      }
    );

    if (challengeError) throw challengeError;

    // Convert base64 to Uint8Array
    const challenge = Uint8Array.from(atob(challengeData.challenge), c => c.charCodeAt(0));
    const userId_bytes = Uint8Array.from(atob(challengeData.userId), c => c.charCodeAt(0));

    // Create credentials
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'KKU Attendance System',
          id: window.location.hostname,
        },
        user: {
          id: userId_bytes,
          name: userName,
          displayName: userName,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
        attestation: 'none',
      },
    }) as PublicKeyCredential;

    if (!credential) {
      throw new Error('Failed to create credential');
    }

    // Get attestation response
    const attestationResponse = credential.response as AuthenticatorAttestationResponse;
    
    // Convert to base64 for transmission
    const credentialData = {
      id: credential.id,
      rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
      response: {
        attestationObject: btoa(
          String.fromCharCode(...new Uint8Array(attestationResponse.attestationObject))
        ),
        clientDataJSON: btoa(
          String.fromCharCode(...new Uint8Array(attestationResponse.clientDataJSON))
        ),
      },
      type: credential.type,
    };

    // Verify with Edge Function
    const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
      'webauthn-register-verify',
      {
        body: {
          userId,
          credential: credentialData,
          challenge: challengeData.challenge,
        },
      }
    );

    if (verifyError) throw verifyError;

    return { success: true, credentialId: credential.id };
  } catch (error) {
    console.error('WebAuthn registration error:', error);
    throw error;
  }
}

export async function authenticateWebAuthn(userId: string) {
  try {
    // Get user's credentials
    const { data: credentials, error: credError } = await supabase
      .from('webauthn_credentials')
      .select('credential_id')
      .eq('user_id', userId);

    if (credError || !credentials || credentials.length === 0) {
      throw new Error('No credentials found. Please enroll biometric first.');
    }

    // Get challenge from Edge Function
    const { data: challengeData, error: challengeError } = await supabase.functions.invoke(
      'webauthn-assert-challenge',
      {
        body: { userId },
      }
    );

    if (challengeError) throw challengeError;

    const challenge = Uint8Array.from(atob(challengeData.challenge), c => c.charCodeAt(0));

    // Get assertion
    const allowCredentials = credentials.map((cred) => ({
      id: Uint8Array.from(atob(cred.credential_id), c => c.charCodeAt(0)),
      type: 'public-key' as const,
    }));

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials,
        timeout: 60000,
        userVerification: 'required',
      },
    }) as PublicKeyCredential;

    if (!assertion) {
      throw new Error('Authentication failed');
    }

    const assertionResponse = assertion.response as AuthenticatorAssertionResponse;

    // Convert to base64
    const assertionData = {
      id: assertion.id,
      rawId: btoa(String.fromCharCode(...new Uint8Array(assertion.rawId))),
      response: {
        authenticatorData: btoa(
          String.fromCharCode(...new Uint8Array(assertionResponse.authenticatorData))
        ),
        clientDataJSON: btoa(
          String.fromCharCode(...new Uint8Array(assertionResponse.clientDataJSON))
        ),
        signature: btoa(
          String.fromCharCode(...new Uint8Array(assertionResponse.signature))
        ),
        userHandle: assertionResponse.userHandle
          ? btoa(String.fromCharCode(...new Uint8Array(assertionResponse.userHandle)))
          : null,
      },
      type: assertion.type,
    };

    // Verify with Edge Function
    const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
      'webauthn-assert-verify',
      {
        body: {
          userId,
          assertion: assertionData,
          challenge: challengeData.challenge,
        },
      }
    );

    if (verifyError) throw verifyError;

    return { success: true, verified: verifyData.verified };
  } catch (error) {
    console.error('WebAuthn authentication error:', error);
    throw error;
  }
}

export async function checkUserHasWebAuthn(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('webauthn_credentials')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  return !error && data && data.length > 0;
}
