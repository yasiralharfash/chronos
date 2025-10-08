
import React, { useState } from "react";
import { GeofenceLocation } from "@/api/entities";
import { User } from "@/api/entities"; // Assuming User entity exists for fetching user data
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Trash2, Map } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function GeofenceList({ geofences, onUpdate }) {
  const [user, setUser] = React.useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    radius: 100
  });
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (err) {
      console.error("Failed to load user data:", err);
      setError("Failed to load user data. Geofence creation might be unavailable.");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!user || !user.company_id) {
      setError("User data not loaded or company ID missing. Cannot create geofence.");
      setLoading(false);
      return;
    }

    try {
      await GeofenceLocation.create({
        ...formData,
        company_id: user.company_id,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        radius: parseInt(formData.radius)
      });
      setFormData({ name: "", address: "", latitude: "", longitude: "", radius: 100 });
      setShowCreate(false);
      onUpdate();
    } catch (error) {
      console.error("Create error:", error);
      setError("Failed to create geofence location. Please try again.");
    }
    setLoading(false);
  };

  const handleDelete = async (geoId) => {
    if (!confirm("Are you sure you want to delete this geofence location?")) {
      return;
    }

    setError(null);
    try {
      await GeofenceLocation.delete(geoId);
      onUpdate();
    } catch (error) {
      console.error("Delete error:", error);
      if (error.response?.status === 404) {
        setError("This geofence location has already been deleted.");
        onUpdate();
      } else {
        setError("Failed to delete geofence location. Please try again.");
      }
    }
  };

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    setError(null);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      setFormData({
        ...formData,
        latitude: position.coords.latitude.toString(),
        longitude: position.coords.longitude.toString()
      });
    } catch (error) {
      setError("Could not get current location. Please enter coordinates manually or check location permissions.");
    }
    setGettingLocation(false);
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Geofence Locations</h3>
          <p className="text-sm text-slate-500 mt-1">
            Set allowed locations for clock in/out with GPS verification
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} disabled={!user}>
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </Button>
      </div>

      {geofences.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <Map className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">No geofence locations configured</p>
          <p className="text-sm text-slate-400 mt-1">
            Add locations to restrict where employees can clock in/out
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {geofences.map((geo) => (
            <div
              key={geo.id}
              className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <MapPin className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-slate-900">{geo.name}</h4>
                      <Badge className={geo.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                        {geo.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{geo.address}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                      <span>Lat: {geo.latitude.toFixed(6)}</span>
                      <span>Lng: {geo.longitude.toFixed(6)}</span>
                      <span>Radius: {geo.radius}m</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(geo.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <Dialog open={true} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Geofence Location</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>Location Name</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Main Office"
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="123 Main St, City, State"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Latitude</Label>
                  <Input
                    required
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                    placeholder="40.7128"
                  />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input
                    required
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                    placeholder="-74.0060"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="w-full"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {gettingLocation ? "Getting Location..." : "Use Current Location"}
              </Button>
              <div>
                <Label>Radius (meters)</Label>
                <Input
                  required
                  type="number"
                  value={formData.radius}
                  onChange={(e) => setFormData({...formData, radius: e.target.value})}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Employees must be within this distance to clock in/out
                </p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !user}>
                  {loading ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
