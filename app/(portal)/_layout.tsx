import { Tabs } from "expo-router";
import { FloatingTabBar } from "../../components/ui/FloatingTabBar";

export default function PortalLayout() {
    return (
        <Tabs
            tabBar={(props) => <FloatingTabBar {...props} />}
            screenOptions={{
                headerShown: false,
                sceneStyle: { backgroundColor: 'hsl(224 71% 4%)' } // var(--background) equivalent
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                }}
            />
            <Tabs.Screen
                name="tickets"
                options={{
                    title: "Tickets",
                }}
            />
            <Tabs.Screen
                name="email"
                options={{
                    title: "Email",
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: "Settings",
                }}
            />
        </Tabs>
    );
}
