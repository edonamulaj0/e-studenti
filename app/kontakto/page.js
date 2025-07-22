"use client";
import { Mail } from "lucide-react";

<div className="pt-20 min-h-screen bg-gradient-to-br from-red-50 to-indigo-100">
  <div className="container mx-auto px-4 py-16">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-center mb-12">Na kontaktoni</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact Information */}
        <div>
          <div className="space-y-6">
            <div className="flex items-center">
              <Mail className="w-6 h-6 text-red-600 mr-4" />
              <div>
                <h3 className="font-semibold">Email</h3>
                <p className="text-gray-600">info@e-studenti.com</p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-red-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Dërgo materiale!</h3>
            <p className="text-gray-600">
              A keni materiale, afate apo burime të tjera për të ndarë me
              studentët? Na dërgoni email me të dhënat: Fakulteti, Departamenti,
              Lënda.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>;
