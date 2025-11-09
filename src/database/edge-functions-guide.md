# Edge Functions for WebAuthn

This guide explains how to create the necessary Edge Functions in Supabase for WebAuthn authentication.

## Required Edge Functions

You need to create 4 Edge Functions in your Supabase project:

### 1. webauthn-register-challenge

**Path:** `/functions/webauthn-register-challenge/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const { userId, userName } = await req.json();
    
    // Generate random challenge
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const challengeBase64 = btoa(String.fromCharCode(...challenge));
    const userIdBase64 = btoa(userId);
    
    // Store challenge in session/cache (implement your storage)
    // For production, use Supabase storage or Redis
    
    return new Response(
      JSON.stringify({
        challenge: challengeBase64,
        userId: userIdBase64,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
```

### 2. webauthn-register-verify

**Path:** `/functions/webauthn-register-verify/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { userId, credential, challenge } = await req.json();
    
    // Verify the attestation
    // In production, implement full WebAuthn verification
    // For now, we'll store the credential
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // Extract public key from credential
    // This is simplified - use a proper WebAuthn library in production
    const credentialId = credential.id;
    const publicKey = credential.response.attestationObject;
    
    // Store in database
    const { error } = await supabase.from("webauthn_credentials").insert({
      user_id: userId,
      credential_id: btoa(credentialId),
      public_key: publicKey,
      counter: 0,
    });
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
```

### 3. webauthn-assert-challenge

**Path:** `/functions/webauthn-assert-challenge/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const { userId } = await req.json();
    
    // Generate random challenge
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const challengeBase64 = btoa(String.fromCharCode(...challenge));
    
    // Store challenge for verification
    // In production, use proper session storage
    
    return new Response(
      JSON.stringify({
        challenge: challengeBase64,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
```

### 4. webauthn-assert-verify

**Path:** `/functions/webauthn-assert-verify/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { userId, assertion, challenge } = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // Get stored credentials
    const { data: credentials } = await supabase
      .from("webauthn_credentials")
      .select("*")
      .eq("user_id", userId);
    
    if (!credentials || credentials.length === 0) {
      throw new Error("No credentials found");
    }
    
    // Verify the assertion signature
    // In production, implement full WebAuthn verification
    // This is a simplified version
    
    const verified = true; // Implement actual verification
    
    if (verified) {
      // Update counter
      await supabase
        .from("webauthn_credentials")
        .update({ counter: credentials[0].counter + 1 })
        .eq("id", credentials[0].id);
    }
    
    return new Response(
      JSON.stringify({ verified }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
```

## Deployment Instructions

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref bscxhshnubkhngodruuj
```

4. Deploy functions:
```bash
supabase functions deploy webauthn-register-challenge
supabase functions deploy webauthn-register-verify
supabase functions deploy webauthn-assert-challenge
supabase functions deploy webauthn-assert-verify
```

## Note

For production use, you should use a proper WebAuthn library like:
- https://deno.land/x/webauthn
- Or implement the full W3C WebAuthn specification

The code above is simplified for demonstration purposes.
