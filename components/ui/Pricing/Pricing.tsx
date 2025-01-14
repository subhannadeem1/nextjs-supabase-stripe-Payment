'use client';

import { useEffect } from 'react';


export default function Pricing() {


  // Dynamically add the Stripe Pricing Table script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/pricing-table.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <section className="bg-white text-black">
      <div className="max-w-6xl  px-4 py-8 mx-auto sm:py-24 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center">Pricing</h2>
        <div className="pt-36">
          <stripe-pricing-table
            pricing-table-id="prctbl_1QecHyBiDW7kGn9FPxuXnYSG"
            publishable-key="pk_test_51QeWvBBiDW7kGn9FXnrQsuQ46773FDQ6AieGbM0Fz7nuI7HrQRTsNteEyzdrrBxnUrO3pfTrznzWBRKZIFXW4sNk008Z2gsRuJ"
          ></stripe-pricing-table>
        </div>
      </div>
    </section>
  );
}
