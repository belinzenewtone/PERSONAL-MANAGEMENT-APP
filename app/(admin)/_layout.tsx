import { Tabs } from "expo-router";
import { FloatingTabBar } from "../../components/ui/FloatingTabBar";

export default function AdminLayout() {
    return (
        <Tabs
            tabBar={(props) => <FloatingTabBar {...props} />}
            screenOptions={{
                headerShown: false,
                sceneStyle: { backgroundColor: 'hsl(224 71% 4%)' }
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                }}
            />
            <Tabs.Screen
                name="email"
                options={{
                    title: "Email",
                }}
            />
            <Tabs.Screen
                name="tasks"
                options={{
                    title: "Tasks",
                }}
            />
            <Tabs.Screen
                name="tickets"
                options={{
                    title: "Tickets",
                }}
            />
            <Tabs.Screen
                name="more"
                options={{
                    title: "More", // Reports & Machines can go in here later
                }}
            />
        </Tabs>
    );
}
