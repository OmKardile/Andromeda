/*
 * Adapted from Stario (https://github.com/albu-razvan/Stario), archived May 2026.
 * Original: app/src/main/java/com/stario/launcher/apps/LauncherApplication.java
 * Original copyright (C) 2025 Răzvan Albu — GPL-3.0.
 *
 * Changes from the original: package renamed for this fork; the launch()
 * method took a ThemedActivity in Stario (its own base Activity class,
 * needed for theme-aware UI work this data model shouldn't care about) —
 * here it just takes a plain Context, and the one-line Utils.getMainActivity
 * lookup it called out to is inlined directly rather than pulling in
 * Stario's whole Utils.java. The `category` field (a UUID pointing into
 * Stario's Category/CategoryManager system) is dropped for now — see
 * /reference/stario-source for the real thing when folder work starts.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>
 */

package dev.omkardile.andromeda.core.engine;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.LauncherActivityInfo;
import android.content.pm.LauncherApps;
import android.graphics.drawable.Drawable;
import android.os.UserHandle;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.util.List;

public class LauncherApplication implements Comparable<LauncherApplication> {

    public final boolean systemPackage;

    @NonNull
    public final ApplicationInfo info;
    @NonNull
    public final String label;
    public final UserHandle handle;
    public Drawable icon;

    public LauncherApplication(@NonNull ApplicationInfo info, @NonNull UserHandle handle, @NonNull String label) {
        this.info = info;
        this.label = label;
        this.icon = null;
        this.handle = handle;
        this.systemPackage = (info.flags & ApplicationInfo.FLAG_SYSTEM) != 0;
    }

    public void launch(@NonNull Context context) {
        LauncherApps launcherApps = context.getSystemService(LauncherApps.class);
        List<LauncherActivityInfo> activities = launcherApps.getActivityList(info.packageName, handle);

        if (!activities.isEmpty()) {
            launcherApps.startMainActivity(activities.get(0).getComponentName(), handle, null, null);
        }
    }

    @NonNull
    public ApplicationInfo getInfo() {
        return info;
    }

    @NonNull
    public String getLabel() {
        return label;
    }

    public Drawable getIcon() {
        return icon;
    }

    public UserHandle getProfile() {
        return handle;
    }

    @Override
    public int hashCode() {
        return info.packageName.hashCode();
    }

    @Override
    public boolean equals(@Nullable Object obj) {
        if (this == obj) {
            return true;
        } else if (obj instanceof LauncherApplication) {
            LauncherApplication other = (LauncherApplication) obj;

            return info.packageName.equals(other.info.packageName) &&
                    handle.equals(other.handle);
        } else {
            return false;
        }
    }

    @Override
    public int compareTo(@NonNull LauncherApplication other) {
        int result = getLabel().compareToIgnoreCase(other.getLabel());
        return result != 0 ? result : handle.hashCode() - other.handle.hashCode();
    }
}
