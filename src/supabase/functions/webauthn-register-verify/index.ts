// Deno Edge Function: WebAuthn Registration Verification
// Purpose: Verify and store biometric credential

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import * as base64 from 'https://deno.land/std@0.168.0/encoding/base64.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CredentialData {
  id: string;
  rawId: string;
  response: {
    attestationObject: string;
    clientDataJSON: string;
  };
  type: string;
}

interface RequestBody {
  userId: string;
  credential: CredentialData;
  challenge: string;
}

// Parse attestation object (simplified - for production use a library like @simplewebauthn/server)
function parseAttestationObject(attestationObjectB64: string) {
  const attestationBuffer = base64.decode(attestationObjectB64);
  
  // For production, properly decode CBOR attestation object
  // This is a simplified version that extracts the credential ID
  return {
    credentialId: attestationObjectB64.substring(0, 40), // Simplified
    publicKey: attestationObjectB64, // Store full attestation for now
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role for database operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Initialize client with user's token for auth check
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const { userId, credential, challenge }: RequestBody = await req.json();

    // Verify user is registering for themselves
    if (user.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify clientDataJSON contains the challenge
    const clientDataJSON = JSON.parse(
      atob(credential.response.clientDataJSON)
    );

    if (clientDataJSON.challenge !== challenge) {
      return new Response(
        JSON.stringify({ error: 'Challenge verification failed' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse attestation object
    const { credentialId, publicKey } = parseAttestationObject(
      credential.response.attestationObject
    );

    // Store credential in database
    const { data, error } = await supabaseClient
      .from('webauthn_credentials')
      .insert({
        user_id: userId,
        credential_id: btoa(credential.id), // Store as base64
        public_key: publicKey,
        counter: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to store credential' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        credentialId: data.credential_id,
        message: 'Biometric registered successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
