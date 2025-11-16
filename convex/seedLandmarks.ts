import { mutation } from "./_generated/server";

// Seed initial landmarks
export const seedInitialLandmarks = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if landmarks already exist
    const existing = await ctx.db.query("landmarks").first();
    if (existing) {
      return { message: "Landmarks already seeded" };
    }

    // Insert default landmarks
    const landmarks = [
      {
        name: "SM City Legazpi",
        icon: "🏢",
        color: "#3b82f6",
        latitude: 13.1440593,
        longitude: 123.7450903,
        googleMapsUrl: "https://www.google.com/maps/@13.1440593,123.7450903,336m/data=!3m1!1e3",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        name: "Yashano Mall",
        icon: "🏬",
        color: "#a855f7",
        latitude: 13.146343,
        longitude: 123.7461129,
        googleMapsUrl: "https://www.google.com/maps/place/Yashano+Mall+Legazpi/@13.1458735,123.7464726,336m/data=!3m1!1e3",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        name: "Mayon Volcano",
        icon: "🌋",
        color: "#ef4444",
        latitude: 13.254832,
        longitude: 123.6861124,
        googleMapsUrl: "https://www.google.com/maps/place/Mayon+Volcano/@13.2530982,123.6841639,2466m/data=!3m1!1e3",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    for (const landmark of landmarks) {
      await ctx.db.insert("landmarks", landmark);
    }

    return { message: "Successfully seeded 3 landmarks", count: landmarks.length };
  },
});
