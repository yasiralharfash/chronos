
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Clock, Loader2, AlertCircle } from "lucide-react";
import { TimeEntry } from "@/api/entities";
import { GeofenceLocation } from "@/api/entities";
import { User } from "@/api/entities";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function QuickClockButton({ currentEntry, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("");
  const [geofenceError, setGeofenceError] = useState(null);

  useEffect(() => {
    if (currentEntry) {
      const interval = setInterval(() => {
        const start = new Date(currentEntry.clock_in);
        const now = new Date();
        const diff = Math.floor((now - start) / 1000);
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        setElapsedTime(`${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentEntry]);

  const checkGeofence = async (latitude, longitude) => {
    const geofences = await GeofenceLocation.filter({ is_active: true }, "name", 100);
    
    if (geofences.length === 0) {
      return true;
    }

    const isWithinAnyGeofence = geofences.some(geo => {
      const distance = getDistanceFromLatLonInMeters(
        latitude, longitude,
        geo.latitude, geo.longitude
      );
      return distance <= geo.radius;
    });

    return isWithinAnyGeofence;
  };

  const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  const handleClock = async () => {
    setLoading(true);
    setGeofenceError(null);
    
    try {
      const user = await User.me();
      let location = null;

      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };

        const isAllowed = await checkGeofence(location.latitude, location.longitude);
        if (!isAllowed) {
          setGeofenceError("You are not within an allowed location to clock in/out. Please contact your administrator.");
          setLoading(false);
          return;
        }
      } catch (error) {
        setGeofenceError("Location access is required. Please enable location services and try again.");
        setLoading(false);
        return;
      }

      if (currentEntry) {
        const clockOut = new Date().toISOString();
        const clockIn = new Date(currentEntry.clock_in);
        const diff = (new Date(clockOut) - clockIn) / (1000 * 60 * 60);
        const totalHours = Math.max(0, diff - (currentEntry.break_duration || 0) / 60);

        await TimeEntry.update(currentEntry.id, {
          clock_out: clockOut,
          total_hours: parseFloat(totalHours.toFixed(2))
        });
      } else {
        await TimeEntry.create({
          company_id: user.company_id, // ✅ ADDED
          user_email: user.email,
          clock_in: new Date().toISOString(),
          location
        });
      }

      onUpdate();
    } catch (error) {
      console.error("Clock error:", error);
      setGeofenceError("An error occurred: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div>
      {geofenceError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{geofenceError}</AlertDescription>
        </Alert>
      )}
      <Button
        onClick={handleClock}
        disabled={loading}
        size="lg"
        className={`${
          currentEntry
            ? "bg-red-600 hover:bg-red-700"
            : "bg-indigo-600 hover:bg-indigo-700"
        } shadow-lg hover:shadow-xl transition-all duration-300 text-lg px-8`}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <Clock className="w-5 h-5 mr-2" />
        )}
        {currentEntry ? (
          <>Clock Out {elapsedTime && `(${elapsedTime})`}</>
        ) : (
          "Clock In"
        )}
      </Button>
    </div>
  );
}
